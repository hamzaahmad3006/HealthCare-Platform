import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { renderTemplate } from '../helper/template.helper';
import { success, paginated } from '../helper/response.helper';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  assertVisitTransition,
} from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';
import { pickParam } from '../helper/request.helper';

const CheckInSchema = z.object({
  checkInLatitude: z.number(),
  checkInLongitude: z.number(),
  beforeConditionText: z.string().optional(),
});

const CheckOutSchema = z.object({
  checkOutLatitude: z.number().optional(),
  checkOutLongitude: z.number().optional(),
  visitNotes: z.string().optional(),
  afterConditionText: z.string().optional(),
});

const VisitListQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'ASSIGNED', 'EN_ROUTE', 'CHECKED_IN', 'COMPLETED', 'MISSED', 'CANCELLED']).optional(),
  staffUserId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const visitController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { status, staffUserId, fromDate, toDate, page, limit } = VisitListQuerySchema.parse(req.query);

      const where: Prisma.BookingVisitWhereInput = {
        ...(req.user.role === 'STAFF' && { assignedStaffUserId: req.user.sub }),
        ...(staffUserId && req.user.role === 'ADMIN' && { assignedStaffUserId: staffUserId }),
        ...(status && { status }),
        ...(fromDate && { scheduledStartAt: { gte: new Date(fromDate) } }),
        ...(toDate && { scheduledStartAt: { lte: new Date(toDate) } }),
      };

      const [visits, total] = await prisma.$transaction([
        prisma.bookingVisit.findMany({
          where,
          include: { booking: { select: { bookingNumber: true, customerUserId: true, patientId: true, serviceType: { select: { code: true } }, reviews: { select: { rating: true, reviewText: true, createdAt: true } } } } },
          orderBy: { scheduledStartAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.bookingVisit.count({ where }),
      ]);

      paginated(res, visits, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const visit = await prisma.bookingVisit.findUnique({
        where: { id: pickParam(req, 'id') },
        include: { booking: true },
      });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      if (req.user.role === 'STAFF' && visit.assignedStaffUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }
      if (req.user.role === 'CUSTOMER' && visit.booking.customerUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      success(res, visit);
    } catch (err) { next(err); }
  },

  async enRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const visit = await prisma.bookingVisit.findUnique({
        where: { id: pickParam(req, 'id') },
        include: {
          booking: {
            select: {
              bookingNumber: true,
              customerUserId: true,
              address: { select: { contactPhone: true } },
              customer: { select: { phone: true } },
            },
          },
          assignedStaff: { select: { user: { select: { fullName: true } } } },
        },
      });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      if (req.user.role === 'STAFF' && visit.assignedStaffUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      assertVisitTransition(visit.status, 'EN_ROUTE');

      const updated = await prisma.bookingVisit.update({
        where: { id: visit.id },
        data: { status: 'EN_ROUTE' },
      });

      // NotificationLog.recipient is VarChar(20) — must be a phone, never a
      // UUID. Same fix as booking confirm/assign paths.
      const recipient = visit.booking.address.contactPhone ?? visit.booking.customer.phone;
      const templateData = {
        staffName: visit.assignedStaff?.user.fullName ?? 'Your healthcare professional',
        bookingNumber: visit.booking.bookingNumber,
        eta: '20',
      };

      const notifLog = await prisma.notificationLog.create({
        data: {
          userId: visit.booking.customerUserId,
          bookingId: visit.bookingId,
          bookingVisitId: visit.id,
          templateCode: 'STAFF_EN_ROUTE',
          recipient,
          renderedContent: renderTemplate('STAFF_EN_ROUTE', templateData),
          templateData,
          status: 'PENDING',
        },
      });

      await notificationQueue.add('send', { notificationLogId: notifLog.id }).catch(() => null);

      success(res, updated);
    } catch (err) { next(err); }
  },

  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const offlineSyncId = req.headers['x-offline-sync-id'] as string | undefined;
      const data = CheckInSchema.parse(req.body);

      const visit = await prisma.bookingVisit.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      if (req.user.role === 'STAFF' && visit.assignedStaffUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      if (offlineSyncId && visit.offlineSyncId === offlineSyncId) {
        success(res, visit);
        return;
      }

      if (!['ASSIGNED', 'EN_ROUTE'].includes(visit.status)) {
        throw new ConflictError('VISIT_ALREADY_CHECKED_IN');
      }

      const updated = await prisma.bookingVisit.update({
        where: { id: visit.id },
        data: {
          status: 'CHECKED_IN',
          checkInAt: new Date(),
          checkInLatitude: data.checkInLatitude,
          checkInLongitude: data.checkInLongitude,
          beforeConditionText: data.beforeConditionText,
          offlineSyncId: offlineSyncId ?? null,
        },
      });

      await prisma.booking.update({
        where: { id: visit.bookingId },
        data: { status: 'IN_PROGRESS' },
      }).catch(() => null);

      success(res, updated);
    } catch (err) { next(err); }
  },

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const offlineSyncId = req.headers['x-offline-sync-id'] as string | undefined;
      const data = CheckOutSchema.parse(req.body);

      const visit = await prisma.bookingVisit.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      if (req.user.role === 'STAFF' && visit.assignedStaffUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      if (offlineSyncId && visit.offlineSyncId === offlineSyncId) {
        success(res, visit);
        return;
      }

      // checkOut records timestamps and notes but does NOT change status.
      // The state machine transition to COMPLETED happens in `complete()`.
      if (visit.status !== 'CHECKED_IN') {
        throw new ConflictError('VISIT_NOT_CHECKED_IN', 'Cannot check out — staff has not checked in');
      }

      const updated = await prisma.bookingVisit.update({
        where: { id: visit.id },
        data: {
          checkOutAt: new Date(),
          checkOutLatitude: data.checkOutLatitude,
          checkOutLongitude: data.checkOutLongitude,
          visitNotes: data.visitNotes,
          afterConditionText: data.afterConditionText,
          offlineSyncId: offlineSyncId ?? null,
        },
      });

      success(res, updated);
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const visit = await prisma.bookingVisit.findUnique({
        where: { id: pickParam(req, 'id') },
        include: {
          booking: {
            select: {
              bookingNumber: true,
              customerUserId: true,
              address: { select: { contactPhone: true } },
              customer: { select: { phone: true } },
            },
          },
        },
      });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      if (req.user.role === 'STAFF' && visit.assignedStaffUserId !== req.user.sub) {
        throw new ForbiddenError('FORBIDDEN');
      }

      assertVisitTransition(visit.status, 'COMPLETED');

      await prisma.$transaction(async (tx) => {
        await tx.bookingVisit.update({
          where: { id: visit.id },
          data: { status: 'COMPLETED', completedByStaffUserId: req.user!.sub },
        });

        const remainingVisits = await tx.bookingVisit.count({
          where: { bookingId: visit.bookingId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        });

        if (remainingVisits === 0) {
          await tx.booking.update({
            where: { id: visit.bookingId },
            data: { status: 'COMPLETED' },
          });
        }
      });

      const recipient = visit.booking.address.contactPhone ?? visit.booking.customer.phone;
      const templateData = {
        bookingNumber: visit.booking.bookingNumber,
        visitNotes: visit.visitNotes ?? undefined,
      };

      const notifLog = await prisma.notificationLog.create({
        data: {
          userId: visit.booking.customerUserId,
          bookingId: visit.bookingId,
          bookingVisitId: visit.id,
          templateCode: 'VISIT_COMPLETED',
          recipient,
          renderedContent: renderTemplate('VISIT_COMPLETED', templateData),
          templateData,
          status: 'PENDING',
        },
      });

      await notificationQueue.add('send', { notificationLogId: notifLog.id }).catch(() => null);

      const updatedVisit = await prisma.bookingVisit.findUnique({ where: { id: visit.id } });
      success(res, updatedVisit);
    } catch (err) { next(err); }
  },

  async miss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

      const visit = await prisma.bookingVisit.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      const updated = await prisma.bookingVisit.update({
        where: { id: visit.id },
        data: { status: 'MISSED', cancellationReason: reason },
      });

      success(res, updated);
    } catch (err) { next(err); }
  },

  async cancelVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

      const visit = await prisma.bookingVisit.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!visit) throw new NotFoundError('VISIT_NOT_FOUND');

      assertVisitTransition(visit.status, 'CANCELLED');

      const updated = await prisma.bookingVisit.update({
        where: { id: visit.id },
        data: { status: 'CANCELLED', cancellationReason: reason },
      });

      success(res, updated);
    } catch (err) { next(err); }
  },
};
