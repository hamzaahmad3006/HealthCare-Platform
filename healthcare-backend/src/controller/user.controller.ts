import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { success, paginated } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError, ForbiddenError, BusinessError } from '../utils/stateMachine';
import { pickParam } from '../helper/request.helper';
import { authorizedBookingWhere } from '../helper/bookingAccess.helper';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(150).optional(),
  email: z.string().email().optional(),
});

const CreatePatientSchema = z.object({
  fullName: z.string().min(1).max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date').optional(),
  relationshipToCustomer: z.string().max(50).optional(),
  primaryCondition: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
  defaultAddressId: z.string().uuid().optional(),
});

const CreateAddressSchema = z.object({
  cityId: z.string().uuid(),
  zoneId: z.string().uuid().optional(),
  label: z.string().max(50).optional(),
  contactName: z.string().min(1).max(150),
  contactPhone: z.string().min(1).max(20),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  area: z.string().min(1).max(120),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
          id: true, role: true, fullName: true, phone: true,
          email: true, status: true, phoneVerified: true,
          emailVerified: true, lastLoginAt: true, createdAt: true,
        },
      });

      if (!user) throw new NotFoundError('USER_NOT_FOUND');
      success(res, user);
    } catch (err) { next(err); }
  },

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const data = UpdateProfileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: req.user.sub },
        data,
        select: { id: true, fullName: true, email: true, phone: true, updatedAt: true },
      });

      success(res, user);
    } catch (err) { next(err); }
  },

  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const data = CreatePatientSchema.parse(req.body);
      await assertCustomerAddress(req.user.sub, data.defaultAddressId);

      const patient = await prisma.patient.create({
        data: {
          customerUserId: req.user.sub,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          relationshipToCustomer: data.relationshipToCustomer,
          primaryCondition: data.primaryCondition,
          allergies: data.allergies,
          notes: data.notes,
          defaultAddressId: data.defaultAddressId,
        },
      });

      success(res, patient, 201);
    } catch (err) { next(err); }
  },

  async getPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const { page, limit } = PaginationSchema.parse(req.query);

      let where: Prisma.PatientWhereInput;
      if (req.user.role === 'ADMIN') {
        where = {};
      } else if (req.user.role === 'STAFF') {
        where = { bookings: { some: await authorizedBookingWhere(req.user) } };
      } else {
        where = { customerUserId: req.user.sub };
      }

      const [patients, total] = await prisma.$transaction([
        prisma.patient.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { fullName: 'asc' } }),
        prisma.patient.count({ where }),
      ]);

      paginated(res, patients, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const patient = await prisma.patient.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!patient) throw new NotFoundError('PATIENT_NOT_FOUND');

      if (req.user.role === 'STAFF') {
        const authorized = await prisma.patient.findFirst({
          where: { id: patient.id, bookings: { some: await authorizedBookingWhere(req.user) } },
          select: { id: true },
        });
        if (!authorized) throw new ForbiddenError('FORBIDDEN');
      } else if (req.user.role !== 'ADMIN' && patient.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      success(res, patient);
    } catch (err) { next(err); }
  },

  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const existing = await prisma.patient.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!existing) throw new NotFoundError('PATIENT_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && existing.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const { dateOfBirth, ...rest } = CreatePatientSchema.partial().parse(req.body);
      await assertCustomerAddress(existing.customerUserId, rest.defaultAddressId);
      const patient = await prisma.patient.update({
        where: { id: pickParam(req, 'id') },
        data: {
          ...rest,
          ...(dateOfBirth !== undefined ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        },
      });
      success(res, patient);
    } catch (err) { next(err); }
  },

  async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const data = CreateAddressSchema.parse(req.body);

      const address = await prisma.address.create({
        data: { ...data, customerUserId: req.user.sub },
      });

      success(res, address, 201);
    } catch (err) { next(err); }
  },

  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const { page, limit } = PaginationSchema.parse(req.query);

      const where = req.user.role === 'ADMIN' ? {} : { customerUserId: req.user.sub };
      const [addresses, total] = await prisma.$transaction([
        prisma.address.findMany({ where, skip: (page - 1) * limit, take: limit }),
        prisma.address.count({ where }),
      ]);

      paginated(res, addresses, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const existing = await prisma.address.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!existing) throw new NotFoundError('ADDRESS_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && existing.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const data = CreateAddressSchema.partial().parse(req.body);
      const address = await prisma.address.update({ where: { id: pickParam(req, 'id') }, data });
      success(res, address);
    } catch (err) { next(err); }
  },

  async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const patientId = pickParam(req, 'id');
      await prisma.$transaction(async (tx) => {
        const existing = await tx.patient.findUnique({ where: { id: patientId } });
        if (!existing) throw new NotFoundError('PATIENT_NOT_FOUND');
        if (req.user!.role !== 'ADMIN' && existing.customerUserId !== req.user!.sub) {
          throw new ForbiddenError('FORBIDDEN');
        }

        // Keep every booking and clinical report attached to its original patient,
        // including cancelled/completed bookings and doctor time proposals.
        const booking = await tx.booking.findFirst({ where: { patientId }, select: { id: true } });
        const report = booking ? null : await tx.report.findFirst({ where: { patientId }, select: { id: true } });
        if (booking || report) {
          throw new BusinessError('PATIENT_HAS_HISTORY', 'Patients with booking or report history cannot be removed');
        }
        await tx.patient.delete({ where: { id: patientId } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      success(res, { message: 'Patient removed' });
    } catch (err) {
      if (isDeletionRace(err)) return next(new BusinessError('PATIENT_HAS_HISTORY', 'Patient records changed; refresh and try again'));
      next(err);
    }
  },

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const addressId = pickParam(req, 'id');
      await prisma.$transaction(async (tx) => {
        const existing = await tx.address.findUnique({ where: { id: addressId } });
        if (!existing) throw new NotFoundError('ADDRESS_NOT_FOUND');
        if (req.user!.role !== 'ADMIN' && existing.customerUserId !== req.user!.sub) {
          throw new ForbiddenError('FORBIDDEN');
        }

        const booking = await tx.booking.findFirst({ where: { addressId }, select: { id: true } });
        const defaultPatient = booking ? null : await tx.patient.findFirst({
          where: { defaultAddressId: addressId }, select: { id: true },
        });
        if (booking || defaultPatient) {
          throw new BusinessError('ADDRESS_IN_USE', 'Addresses used by bookings or patients cannot be removed');
        }
        await tx.address.delete({ where: { id: addressId } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      success(res, { message: 'Address deleted' });
    } catch (err) {
      if (isDeletionRace(err)) return next(new BusinessError('ADDRESS_IN_USE', 'Address records changed; refresh and try again'));
      next(err);
    }
  },
};

function isDeletionRace(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2014', 'P2034'].includes(err.code);
}

async function assertCustomerAddress(customerUserId: string, addressId?: string): Promise<void> {
  if (!addressId) return;
  const address = await prisma.address.findFirst({
    where: { id: addressId, customerUserId }, select: { id: true },
  });
  if (!address) throw new BusinessError('PATIENT_ADDRESS_MISMATCH', 'Choose an address belonging to this customer');
}
