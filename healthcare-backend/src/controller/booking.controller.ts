import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, BookingStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { generateBookingNumber, generateVisitSchedule } from '../helper/booking.helper';
import { renderTemplate } from '../helper/template.helper';
import { success, paginated } from '../helper/response.helper';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BusinessError,
  ConflictError,
  assertBookingTransition,
} from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';
import { pickParam } from '../helper/request.helper';

const CreateBookingSchema = z.object({
  patientId: z.string().uuid(),
  serviceTypeId: z.string().uuid(),
  packageId: z.string().uuid(),
  addressId: z.string().uuid(),
  cityId: z.string().uuid(),
  requestedStartAt: z.string().datetime(),
  preferredStaffGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  urgencyLevel: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  specialInstructions: z.string().optional(),
  whatsappNumber: z.string().optional(),
  source: z.enum(['WEB', 'MOBILE', 'ADMIN']).default('WEB'),
});

const BookingListQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  cityId: z.string().uuid().optional(),
  serviceTypeId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const AssignStaffSchema = z.object({
  visitId: z.string().uuid(),
  staffUserId: z.string().uuid(),
});

export const bookingController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const data = CreateBookingSchema.parse(req.body);
      const customerId = req.user.sub;

      const booking = await prisma.$transaction(async (tx) => {
        // Serializable isolation guarantees the COUNT() → INSERT pair below is race-free.
        // Concurrent creators on the same city will retry or fail with a serialization error.
        const patient = await tx.patient.findUnique({ where: { id: data.patientId } });
        if (!patient || patient.customerUserId !== customerId) {
          throw new ForbiddenError('PATIENT_NOT_OWNED', 'Patient does not belong to this customer');
        }

        const address = await tx.address.findUnique({ where: { id: data.addressId } });
        if (!address || address.customerUserId !== customerId) {
          throw new ForbiddenError('ADDRESS_NOT_OWNED', 'Address does not belong to this customer');
        }

        const pkg = await tx.package.findUniqueOrThrow({ where: { id: data.packageId } });
        if (!pkg.isActive) throw new BusinessError('PACKAGE_INACTIVE', 'This package is no longer available');
        if (pkg.serviceTypeId !== data.serviceTypeId) {
          throw new BusinessError('PACKAGE_SERVICE_MISMATCH', 'Package does not match the selected service');
        }

        const city = await tx.city.findUnique({ where: { id: data.cityId } });
        if (!city) throw new NotFoundError('CITY_NOT_FOUND');

        const sequenceResult = await tx.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM bookings WHERE "cityId" = ${data.cityId}
        `;
        const seq = Number(sequenceResult[0]?.count ?? 0) + 1;
        const bookingNumber = generateBookingNumber(city.slug, seq);

        const newBooking = await tx.booking.create({
          data: {
            bookingNumber,
            customerUserId: customerId,
            patientId: data.patientId,
            serviceTypeId: data.serviceTypeId,
            packageId: data.packageId,
            addressId: data.addressId,
            cityId: data.cityId,
            preferredStaffGender: data.preferredStaffGender,
            urgencyLevel: data.urgencyLevel,
            requestedStartAt: new Date(data.requestedStartAt),
            specialInstructions: data.specialInstructions,
            totalPrice: pkg.priceAmount,
            currency: pkg.currency,
            source: data.source,
            status: 'PENDING',
            createdByUserId: customerId,
          },
        });

        const visits = generateVisitSchedule(newBooking.id, pkg, new Date(data.requestedStartAt));
        await tx.bookingVisit.createMany({ data: visits });

        const recipient = data.whatsappNumber ?? address.contactPhone;
        const rendered = renderTemplate('BOOKING_RECEIVED', {
          bookingNumber: newBooking.bookingNumber,
          serviceName: pkg.name,
        });

        const notifLog = await tx.notificationLog.create({
          data: {
            bookingId: newBooking.id,
            templateCode: 'BOOKING_RECEIVED',
            recipient,
            renderedContent: rendered,
            status: 'PENDING',
          },
        });

        return { booking: newBooking, notifLogId: notifLog.id };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 8000 });

      await notificationQueue
        .add('send', { notificationLogId: booking.notifLogId })
        .catch(() => null);

      success(res, booking.booking, 201);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { status, cityId, serviceTypeId, fromDate, toDate, page, limit } =
        BookingListQuerySchema.parse(req.query);

      const where: Prisma.BookingWhereInput = {
        ...(req.user.role === 'CUSTOMER' && { customerUserId: req.user.sub }),
        ...(status && { status }),
        ...(cityId && { cityId }),
        ...(serviceTypeId && { serviceTypeId }),
        ...(fromDate && { requestedStartAt: { gte: new Date(fromDate) } }),
        ...(toDate && { requestedStartAt: { lte: new Date(toDate) } }),
      };

      const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({
          where,
          include: {
            patient: { select: { fullName: true } },
            serviceType: { select: { code: true, name: true } },
            package: { select: { name: true, packageType: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.booking.count({ where }),
      ]);

      paginated(res, bookings, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const booking = await prisma.booking.findUnique({
        where: { id: pickParam(req, 'id') },
        include: {
          patient: true,
          serviceType: true,
          package: true,
          address: true,
          city: true,
          visits: { orderBy: { sequenceNo: 'asc' } },
        },
      });

      if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');

      if (req.user.role === 'CUSTOMER' && booking.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      success(res, booking);
    } catch (err) { next(err); }
  },

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const adminId = req.user.sub;

      const booking = await prisma.booking.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');

      assertBookingTransition(booking.status, 'CONFIRMED');

      // SRS §11 — NotificationLog must be created atomically with the status change.
      const { updated, notifLogId } = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedByUserId: adminId },
        });

        const notifLog = await tx.notificationLog.create({
          data: {
            bookingId: booking.id,
            templateCode: 'BOOKING_CONFIRMED',
            recipient: booking.customerUserId,
            renderedContent: renderTemplate('BOOKING_CONFIRMED', {
              bookingNumber: booking.bookingNumber,
              scheduledDate: booking.requestedStartAt.toISOString(),
            }),
            status: 'PENDING',
          },
        });

        return { updated, notifLogId: notifLog.id };
      });

      await notificationQueue.add('send', { notificationLogId: notifLogId }).catch(() => null);

      success(res, updated);
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
      const bookingId = pickParam(req, 'id');
      if (!bookingId) throw new NotFoundError('BOOKING_NOT_FOUND');

      const allowedStatuses: BookingStatus[] =
        req.user.role === 'CUSTOMER'
          ? [BookingStatus.PENDING, BookingStatus.CONFIRMED]
          : [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS];

      // Atomic UPDATE with WHERE guard — Prisma compiles to a single SQL statement.
      // If 0 rows match, another writer already changed the status.
      const result = await prisma.booking.updateMany({
        where: { id: bookingId, status: { in: allowedStatuses } },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledByUserId: req.user.sub,
          cancellationReason: reason,
        },
      });

      if (result.count === 0) {
        throw new ConflictError(
          'BOOKING_CANNOT_BE_CANCELLED',
          'Booking is already cancelled or cannot be cancelled in its current state',
        );
      }

      const updated = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
      success(res, updated);
    } catch (err) { next(err); }
  },

  async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { requestedStartAt } = z.object({ requestedStartAt: z.string().datetime() }).parse(req.body);

      const booking = await prisma.booking.findUnique({
        where: { id: pickParam(req, 'id') },
        include: { package: true },
      });
      if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');

      assertBookingTransition(booking.status, 'RESCHEDULED');

      const newStartDate = new Date(requestedStartAt);
      const visits = generateVisitSchedule(booking.id, booking.package, newStartDate);

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'RESCHEDULED', requestedStartAt: newStartDate },
        }),
        prisma.bookingVisit.deleteMany({
          where: { bookingId: booking.id, status: 'SCHEDULED' },
        }),
        prisma.bookingVisit.createMany({ data: visits }),
      ]);

      const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
      success(res, updated);
    } catch (err) { next(err); }
  },

  async assignStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { visitId, staffUserId } = AssignStaffSchema.parse(req.body);
      const adminUserId = req.user.sub;

      const result = await prisma.$transaction(
        async (tx) => {
          const visits = await tx.$queryRaw<{ id: string; bookingId: string; status: string; scheduledStartAt: Date; scheduledEndAt: Date | null }[]>`
            SELECT id, "bookingId", status, "scheduledStartAt", "scheduledEndAt"
            FROM booking_visits
            WHERE id = ${visitId}
            FOR UPDATE NOWAIT
          `;

          const visit = visits[0];
          if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');
          if (!['SCHEDULED', 'ASSIGNED'].includes(visit.status)) {
            throw new ConflictError('VISIT_ALREADY_IN_PROGRESS');
          }

          const staffRows = await tx.$queryRaw<{ userId: string; verificationStatus: string; isAvailable: boolean }[]>`
            SELECT "userId", "verificationStatus", "isAvailable"
            FROM staff_profiles
            WHERE "userId" = ${staffUserId}
            FOR UPDATE NOWAIT
          `;

          const staff = staffRows[0];
          if (!staff) throw new NotFoundError('STAFF_NOT_FOUND');
          if (staff.verificationStatus !== 'VERIFIED') {
            throw new BusinessError('STAFF_NOT_VERIFIED', 'Staff must be verified before assignment');
          }
          if (!staff.isAvailable) {
            throw new ConflictError('STAFF_NOT_AVAILABLE', 'Staff is currently unavailable');
          }

          const endAt = visit.scheduledEndAt ?? visit.scheduledStartAt;
          const collision = await tx.bookingVisit.findFirst({
            where: {
              assignedStaffUserId: staffUserId,
              status: { in: ['ASSIGNED', 'EN_ROUTE', 'CHECKED_IN'] },
              scheduledStartAt: { lte: endAt },
              scheduledEndAt: { gte: visit.scheduledStartAt },
            },
          });

          if (collision) throw new ConflictError('STAFF_SCHEDULE_CONFLICT', 'Staff has an overlapping visit');

          await tx.bookingVisit.update({
            where: { id: visitId },
            data: { assignedStaffUserId: staffUserId, status: 'ASSIGNED' },
          });

          await tx.bookingAssignment.create({
            data: {
              bookingId: visit.bookingId,
              bookingVisitId: visitId,
              staffUserId,
              assignedByUserId: adminUserId,
              status: 'ASSIGNED',
            },
          });

          // NotificationLog created inside the same transaction — atomic with the assignment write.
          const notifLog = await tx.notificationLog.create({
            data: {
              bookingId: visit.bookingId,
              bookingVisitId: visitId,
              templateCode: 'STAFF_ASSIGNED',
              recipient: staffUserId,
              renderedContent: renderTemplate('STAFF_ASSIGNED', {
                staffName: 'Staff',
                bookingNumber: visit.bookingId,
              }),
              status: 'PENDING',
            },
          });

          return { visitId, staffUserId, bookingId: visit.bookingId, notifLogId: notifLog.id };
        },
        { timeout: 5000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      await notificationQueue.add('send', { notificationLogId: result.notifLogId }).catch(() => null);

      success(res, result);
    } catch (err) { next(err); }
  },

  async getVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const booking = await prisma.booking.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');

      if (req.user.role === 'CUSTOMER' && booking.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      const visits = await prisma.bookingVisit.findMany({
        where: { bookingId: pickParam(req, 'id') },
        orderBy: { sequenceNo: 'asc' },
      });

      success(res, visits);
    } catch (err) { next(err); }
  },
};
