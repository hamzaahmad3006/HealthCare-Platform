import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { hashPassword } from '../helper/hash.helper';
import { getPresignedUploadUrl } from '../helper/cloudinary.helper';
import { maskCnic } from '../helper/mask.helper';
import { success, paginated } from '../helper/response.helper';
import { logger } from '../utils/logger';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/stateMachine';
import { VerifStatus } from '@prisma/client';
import { pickParam } from '../helper/request.helper';

const CreateStaffSchema = z.object({
  fullName: z.string().min(1).max(150),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
  cityId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  cnic: z.string().min(1).max(25),
  dateOfBirth: z.string().optional(),
  experienceYears: z.number().int().min(0).default(0),
  serviceTypeIds: z.array(z.string().uuid()).min(1),
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

        const profile = await tx.staffProfile.create({
          data: {
            userId: user.id,
            staffCode: generateStaffCode(),
            cityId: data.cityId,
            zoneId: data.zoneId,
            gender: data.gender,
            cnic: data.cnic,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            experienceYears: data.experienceYears,
          },
        });

        await tx.staffServiceType.createMany({
          data: data.serviceTypeIds.map((serviceTypeId) => ({
            staffUserId: user.id,
            serviceTypeId,
          })),
        });

        return { user, profile };
      });

      // Temp password is logged once for the admin to deliver via secure channel.
      // It must NEVER appear in the response body or audit log payload.
      logger.info('Staff created — deliver temp password via secure channel', {
        userId: result.user.id,
        staffCode: result.profile.staffCode,
      });

      success(
        res,
        {
          userId: result.user.id,
          staffCode: result.profile.staffCode,
          fullName: result.user.fullName,
          phone: result.user.phone,
          tempPasswordDelivered: false,
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
          include: { user: { select: { fullName: true, phone: true, email: true } } },
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

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = pickParam(req, 'userId')!;
      const data = CreateStaffSchema.partial().omit({ serviceTypeIds: true, cnic: true, phone: true }).parse(req.body);

      const staff = await prisma.staffProfile.update({
        where: { userId },
        data: {
          ...(data.cityId && { cityId: data.cityId }),
          ...(data.zoneId && { zoneId: data.zoneId }),
          ...(data.gender && { gender: data.gender }),
          ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        },
      });

      if (data.fullName || data.email) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(data.fullName && { fullName: data.fullName }),
            ...(data.email && { email: data.email }),
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
      const userId = pickParam(req, 'userId')!;
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
};
