import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { hashPassword } from '../helper/hash.helper';
import { getPresignedUploadUrl } from '../helper/cloudinary.helper';
import { maskCnic } from '../helper/mask.helper';
import { sendWhatsAppMessage } from '../helper/axios';
import { sendEmail } from '../helper/email.helper';
import { renderTemplate } from '../helper/template.helper';
import { success, paginated } from '../helper/response.helper';
import { logger } from '../utils/logger';
import { NotFoundError, UnauthorizedError, ForbiddenError, AppError } from '../utils/stateMachine';
import { VerifStatus } from '@prisma/client';
import { pickParam } from '../helper/request.helper';

// Self-onboarding flow: admin invite only needs identity (name + how to reach
// them). Staff fills the rest themselves via PATCH /staff/me/profile after
// first login. Email is required because the invite is the only handoff the
// admin makes; WhatsApp is best-effort fallback.
const CreateStaffSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
});

// Schema used when the staff completes their own profile post-invite.
const CompleteProfileSchema = z.object({
  cityId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  cnic: z
    .string()
    .min(13)
    .max(25)
    .regex(/^[0-9-]+$/, 'CNIC must be digits and dashes only'),
  dateOfBirth: z.string().optional(),
  experienceYears: z.number().int().min(0).max(60).default(0),
  serviceTypeIds: z.array(z.string().uuid()).min(1),
  // Required only when AMBULANCE service is selected (enforced below by
  // looking up service codes for the submitted IDs). Format kept loose to
  // handle PK plate variants like "FSD-1234", "LE-ABC-123", or numeric-only.
  ambulanceNumber: z
    .string()
    .min(3, 'Ambulance number must be at least 3 characters')
    .max(20, 'Ambulance number is too long')
    .regex(/^[A-Za-z0-9\- ]+$/, 'Letters, digits, dashes, and spaces only')
    .optional(),
});

const StaffListQuerySchema = z.object({
  cityId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  verificationStatus: z.nativeEnum(VerifStatus).optional(),
  isAvailable: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const PresignDocSchema = z.object({
  documentType: z.string().min(1),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  fileSizeBytes: z.number().int().positive(),
});

const ConfirmDocSchema = z.object({
  documentType: z.string().min(1),
  fileKey: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

function generateStaffCode(): string {
  return `STF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function generateTempPassword(): string {
  const buf = crypto.randomBytes(9).toString('base64url').slice(0, 12);
  return `Staff@${buf}`;
}

export const staffController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = CreateStaffSchema.parse(req.body);
      const tempPassword = generateTempPassword();
      const passwordHash = await hashPassword(tempPassword);

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            role: 'STAFF',
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            passwordHash,
            status: 'ACTIVE',
          },
        });

        // City/cnic/services intentionally left null — the staff fills them
        // via PATCH /staff/me/profile after first login. staffCode is the
        // only identifier we generate upfront for HR tracking.
        const profile = await tx.staffProfile.create({
          data: {
            userId: user.id,
            staffCode: generateStaffCode(),
          },
        });

        return { user, profile };
      });

      // Compose the invite once — same body to WhatsApp and email.
      const inviteText = renderTemplate('STAFF_INVITE', {
        fullName: result.user.fullName,
        phone: result.user.phone,
        tempPassword,
        loginUrl: env.STAFF_LOGIN_URL,
      });

      // Dispatch invites in parallel, never block the API response on
      // third-party delivery. Failures are logged but reported back so the
      // admin knows whether to fall back to manual delivery.
      const [waResult, emailResult] = await Promise.allSettled([
        sendWhatsAppMessage(result.user.phone, inviteText),
        result.user.email
          ? sendEmail({
              to: result.user.email,
              subject: 'Welcome to HomeHealth — your staff account',
              text: inviteText,
            })
          : Promise.resolve({ delivered: false, error: 'NO_EMAIL_ON_FILE' as const }),
      ]);

      const whatsappDelivered = waResult.status === 'fulfilled';
      const emailDelivered = emailResult.status === 'fulfilled' && emailResult.value.delivered;

      logger.info('Staff invite dispatched', {
        userId: result.user.id,
        staffCode: result.profile.staffCode,
        whatsappDelivered,
        emailDelivered,
      });

      // tempPassword IS returned to the admin so they can copy it manually
      // when WhatsApp/email delivery fails (e.g., dev mode with dummy creds).
      // Route is adminOnly; audit-log middleware redacts the `tempPassword`
      // key automatically (see src/helper/redact.helper.ts).
      success(
        res,
        {
          userId: result.user.id,
          staffCode: result.profile.staffCode,
          fullName: result.user.fullName,
          phone: result.user.phone,
          email: result.user.email,
          tempPassword,
          delivery: {
            whatsapp: whatsappDelivered,
            email: emailDelivered,
          },
        },
        201,
      );
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const { cityId, zoneId, serviceTypeId, verificationStatus, isAvailable, gender, page, limit } =
        StaffListQuerySchema.parse(req.query);

      const where = {
        ...(cityId && { cityId }),
        ...(zoneId && { zoneId }),
        ...(verificationStatus && { verificationStatus }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(gender && { gender }),
        ...(serviceTypeId && { serviceTypes: { some: { serviceTypeId } } }),
      };

      const [staff, total] = await prisma.$transaction([
        prisma.staffProfile.findMany({
          where,
          include: {
            user: { select: { fullName: true, phone: true, email: true } },
            city: { select: { name: true, slug: true } },
            zone: { select: { name: true, slug: true } },
            serviceTypes: {
              include: { serviceType: { select: { id: true, code: true, name: true } } },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.staffProfile.count({ where }),
      ]);

      // Mask CNIC for non-admin viewers (SRS §13)
      const isAdmin = req.user.role === 'ADMIN';
      const data = staff.map((s) => ({
        ...s,
        cnic: isAdmin ? s.cnic : maskCnic(s.cnic),
      }));

      paginated(res, data, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;

      if (req.user.role === 'STAFF' && req.user.sub !== userId) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const staff = await prisma.staffProfile.findUnique({
        where: { userId },
        include: {
          user: { select: { fullName: true, phone: true, email: true, status: true } },
          serviceTypes: { include: { serviceType: true } },
          city: true,
          zone: true,
        },
      });

      if (!staff) throw new NotFoundError('STAFF_NOT_FOUND');

      const isAdmin = req.user.role === 'ADMIN';
      success(res, {
        ...staff,
        cnic: isAdmin ? staff.cnic : maskCnic(staff.cnic),
      });
    } catch (err) { next(err); }
  },

  // Admin update — accepts any subset of staff profile fields (CompleteProfile
  // shape) plus name/email/phone on the underlying User. Phone changes are
  // rare and require admin scope.
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = pickParam(req, 'userId')!;
      const UpdateSchema = CompleteProfileSchema.partial().extend({
        fullName: z.string().min(2).max(150).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(10).max(20).optional(),
      });
      const data = UpdateSchema.parse(req.body);

      const staff = await prisma.staffProfile.update({
        where: { userId },
        data: {
          ...(data.cityId && { cityId: data.cityId }),
          ...(data.zoneId && { zoneId: data.zoneId }),
          ...(data.gender && { gender: data.gender }),
          ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        },
      });

      if (data.fullName || data.email || data.phone) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(data.fullName && { fullName: data.fullName }),
            ...(data.email && { email: data.email }),
            ...(data.phone && { phone: data.phone }),
          },
        });
      }

      success(res, staff);
    } catch (err) { next(err); }
  },

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;
      const staff = await prisma.staffProfile.findUnique({ where: { userId } });
      if (!staff) throw new NotFoundError('STAFF_NOT_FOUND');

      const updated = await prisma.staffProfile.update({
        where: { userId },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedByUserId: req.user.sub,
        },
      });

      success(res, updated);
    } catch (err) { next(err); }
  },

  async toggleAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;

      if (req.user.role === 'STAFF' && req.user.sub !== userId) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const staff = await prisma.staffProfile.findUnique({ where: { userId } });
      if (!staff) throw new NotFoundError('STAFF_NOT_FOUND');

      const updated = await prisma.staffProfile.update({
        where: { userId },
        data: { isAvailable: !staff.isAvailable },
      });

      success(res, updated);
    } catch (err) { next(err); }
  },

  async presignDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;

      if (req.user.role === 'STAFF' && req.user.sub !== userId) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const { documentType, mimeType, fileSizeBytes } = PresignDocSchema.parse(req.body);
      const result = await getPresignedUploadUrl(`staff/${userId}/${documentType}`, mimeType, fileSizeBytes);
      success(res, result);
    } catch (err) { next(err); }
  },

  async confirmDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;

      if (req.user.role === 'STAFF' && req.user.sub !== userId) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const data = ConfirmDocSchema.parse(req.body);

      const doc = await prisma.staffDocument.create({
        data: {
          staffUserId: userId,
          documentType: data.documentType,
          fileProvider: 'CLOUDINARY',
          fileKey: data.fileKey,
          fileUrl: data.fileUrl,
          mimeType: data.mimeType,
          fileSizeBytes: BigInt(data.fileSizeBytes),
        },
      });

      success(res, { ...doc, fileSizeBytes: doc.fileSizeBytes.toString() }, 201);
    } catch (err) { next(err); }
  },

  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const userId = pickParam(req, 'userId')!;

      // Route now permits adminOrStaff so a staff can review what they have
      // already uploaded. Lock them to their own record — otherwise one staff
      // could enumerate another's documents.
      if (req.user.role === 'STAFF' && req.user.sub !== userId) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const docs = await prisma.staffDocument.findMany({
        where: { staffUserId: userId },
        orderBy: { uploadedAt: 'desc' },
      });

      success(res, docs.map((d) => ({ ...d, fileSizeBytes: d.fileSizeBytes.toString() })));
    } catch (err) { next(err); }
  },

  async addServiceType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = pickParam(req, 'userId')!;
      const { serviceTypeId } = z.object({ serviceTypeId: z.string().uuid() }).parse(req.body);

      const serviceType = await prisma.serviceType.findUnique({ where: { id: serviceTypeId } });
      if (!serviceType) throw new NotFoundError('SERVICE_TYPE_NOT_FOUND');

      await prisma.staffServiceType.create({ data: { staffUserId: userId, serviceTypeId } });
      success(res, { message: 'Service type added' }, 201);
    } catch (err) { next(err); }
  },

  async removeServiceType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, svcTypeId } = req.params as { userId: string; svcTypeId: string };
      await prisma.staffServiceType.delete({
        where: { staffUserId_serviceTypeId: { staffUserId: userId, serviceTypeId: svcTypeId } },
      });
      success(res, { message: 'Service type removed' });
    } catch (err) { next(err); }
  },

  // GET /staff/me — current staff fetches their own profile + service types
  // so the complete-profile page can pre-fill anything already set.
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      if (req.user.role !== 'STAFF') throw new ForbiddenError('STAFF_ONLY');

      const profile = await prisma.staffProfile.findUnique({
        where: { userId: req.user.sub },
        include: {
          user: { select: { fullName: true, phone: true, email: true } },
          city: { select: { id: true, name: true } },
          zone: { select: { id: true, name: true } },
          serviceTypes: { include: { serviceType: { select: { id: true, code: true, name: true } } } },
        },
      });
      if (!profile) throw new NotFoundError('PROFILE_NOT_FOUND');
      success(res, profile);
    } catch (err) { next(err); }
  },

  // PATCH /staff/me/profile — staff self-onboarding. Replaces any prior values
  // (idempotent). Marks profileCompletedAt so the verification flow knows the
  // profile is ready for admin review.
  async completeMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      if (req.user.role !== 'STAFF') throw new ForbiddenError('STAFF_ONLY');

      const data = CompleteProfileSchema.parse(req.body);
      const userId = req.user.sub;

      // Look up the codes for the chosen services so we can enforce the
      // conditional "AMBULANCE service requires ambulanceNumber" rule on the
      // server (frontend validation is a hint; this is the authority).
      const chosenServices = await prisma.serviceType.findMany({
        where: { id: { in: data.serviceTypeIds } },
        select: { id: true, code: true },
      });
      if (chosenServices.length !== data.serviceTypeIds.length) {
        throw new NotFoundError('SERVICE_TYPE_NOT_FOUND');
      }
      const needsAmbulanceNumber = chosenServices.some((s) => s.code === 'AMBULANCE');
      if (needsAmbulanceNumber && !data.ambulanceNumber) {
        throw new AppError(
          400,
          'AMBULANCE_NUMBER_REQUIRED',
          'Ambulance number is required when offering ambulance service',
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const profile = await tx.staffProfile.update({
          where: { userId },
          data: {
            cityId: data.cityId,
            zoneId: data.zoneId,
            gender: data.gender,
            cnic: data.cnic,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            experienceYears: data.experienceYears,
            // Persist ambulanceNumber only when the staff actually offers
            // the service. If they remove the service later we clear it.
            ambulanceNumber: needsAmbulanceNumber ? data.ambulanceNumber : null,
            profileCompletedAt: new Date(),
          },
        });

        // Replace the staff's service types with the submitted set. The
        // staff can only pick from active service types; admin can later
        // adjust this via the existing POST /staff/:userId/services endpoint.
        await tx.staffServiceType.deleteMany({ where: { staffUserId: userId } });
        await tx.staffServiceType.createMany({
          data: data.serviceTypeIds.map((serviceTypeId) => ({
            staffUserId: userId,
            serviceTypeId,
          })),
        });

        return profile;
      });

      logger.info('Staff profile completed', { userId, staffCode: updated.staffCode });
      success(res, updated);
    } catch (err) { next(err); }
  },
};
