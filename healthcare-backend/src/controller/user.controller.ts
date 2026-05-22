import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { success, paginated } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/stateMachine';
import { pickParam } from '../helper/request.helper';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(150).optional(),
  email: z.string().email().optional(),
});

const CreatePatientSchema = z.object({
  fullName: z.string().min(1).max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional(),
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

      const where = req.user.role === 'ADMIN' ? {} : { customerUserId: req.user.sub };
      const [patients, total] = await prisma.$transaction([
        prisma.patient.findMany({ where, skip: (page - 1) * limit, take: limit }),
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

      if (req.user.role !== 'ADMIN' && patient.customerUserId !== req.user.sub) {
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

      const existing = await prisma.patient.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!existing) throw new NotFoundError('PATIENT_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && existing.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const activeBooking = await prisma.booking.findFirst({
        where: { patientId: pickParam(req, 'id'), status: { in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] } },
      });

      if (activeBooking) {
        throw new Error('PATIENT_HAS_ACTIVE_BOOKINGS');
      }

      await prisma.patient.delete({ where: { id: pickParam(req, 'id') } });
      success(res, { message: 'Patient removed' });
    } catch (err) { next(err); }
  },

  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const existing = await prisma.address.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!existing) throw new NotFoundError('ADDRESS_NOT_FOUND');

      if (req.user.role !== 'ADMIN' && existing.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const activeBooking = await prisma.booking.findFirst({
        where: { addressId: pickParam(req, 'id'), status: { in: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] } },
      });

      if (activeBooking) {
        throw new Error('ADDRESS_HAS_ACTIVE_BOOKINGS');
      }

      await prisma.address.delete({ where: { id: pickParam(req, 'id') } });
      success(res, { message: 'Address deleted' });
    } catch (err) { next(err); }
  },
};
