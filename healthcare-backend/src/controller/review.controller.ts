import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { success, paginated } from '../helper/response.helper';
import { UnauthorizedError, BusinessError, ForbiddenError, ConflictError } from '../utils/stateMachine';

const CreateReviewSchema = z.object({
  bookingId: z.string().uuid(),
  bookingVisitId: z.string().uuid().optional(),
  staffUserId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional(),
});

const ReviewListQuerySchema = z.object({
  staffUserId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  isLowRating: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const reviewController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const data = CreateReviewSchema.parse(req.body);

      if (req.user.role !== 'CUSTOMER') throw new ForbiddenError('CUSTOMER_REQUIRED');
      const customerUserId = req.user.sub;
      const review = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({ where: { id: data.bookingId } });
        if (!booking || booking.customerUserId !== customerUserId) {
          throw new BusinessError('BOOKING_NOT_ACCESSIBLE', 'You cannot review this booking');
        }
        const visit = data.bookingVisitId
          ? await tx.bookingVisit.findUnique({ where: { id: data.bookingVisitId } }) : null;
        if (data.bookingVisitId && (!visit || visit.bookingId !== booking.id)) {
          throw new BusinessError('VISIT_NOT_ACCESSIBLE', 'Visit does not belong to this booking');
        }
        if (visit && visit.status !== 'COMPLETED') {
          throw new BusinessError('VISIT_NOT_COMPLETED', 'Only completed visits can be reviewed');
        }
        if (data.staffUserId) {
          const staffVisit = visit ?? await tx.bookingVisit.findFirst({ where: {
            bookingId: booking.id, status: 'COMPLETED', assignedStaffUserId: data.staffUserId,
          } });
          if (!staffVisit || staffVisit.assignedStaffUserId !== data.staffUserId) {
            throw new BusinessError('STAFF_NOT_ACCESSIBLE', 'Staff must have performed the reviewed service');
          }
        }
        if (!visit && booking.status !== 'COMPLETED') {
          throw new BusinessError('BOOKING_NOT_COMPLETED', 'Reviews can only be submitted for completed bookings');
        }

        const existing = await tx.review.findFirst({
          where: { bookingId: data.bookingId, customerUserId, bookingVisitId: data.bookingVisitId ?? null },
        });
        if (existing) {
          throw new BusinessError('REVIEW_ALREADY_EXISTS', 'You have already reviewed this booking/visit');
        }

        return tx.review.create({
          data: {
            bookingId: data.bookingId,
            bookingVisitId: data.bookingVisitId,
            customerUserId,
            staffUserId: data.staffUserId,
            rating: data.rating,
            reviewText: data.reviewText,
            isLowRating: data.rating <= 2,
          },
        });

      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      success(res, review, 201);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
        next(new ConflictError('REVIEW_RETRY', 'Another request changed this review. Please retry.'));
      } else next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { staffUserId, bookingId, rating, isLowRating, page, limit } =
        ReviewListQuerySchema.parse(req.query);

      const where: Prisma.ReviewWhereInput = {
        ...(staffUserId && { staffUserId }),
        ...(bookingId && { bookingId }),
        ...(rating !== undefined && { rating }),
        ...(isLowRating !== undefined && { isLowRating }),
      };

      const [reviews, total] = await prisma.$transaction([
        prisma.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      paginated(res, reviews, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const review = await prisma.review.findUnique({ where: { id: req.params['id'] as string } });
      if (!review) { res.status(404).json({ success: false, message: 'Review not found' }); return; }
      const permitted = req.user.role === 'ADMIN'
        || (req.user.role === 'CUSTOMER' && review.customerUserId === req.user.sub)
        || (req.user.role === 'STAFF' && review.staffUserId === req.user.sub);
      if (!permitted) throw new ForbiddenError('REVIEW_NOT_ACCESSIBLE');
      // Historical reviews may contain client-supplied staff IDs. Do not trust
      // those alone to grant access to a customer's feedback.
      if (req.user.role === 'STAFF') {
        const performed = await prisma.bookingVisit.findFirst({ where: {
          bookingId: review.bookingId,
          ...(review.bookingVisitId ? { id: review.bookingVisitId } : {}),
          assignedStaffUserId: req.user.sub, status: 'COMPLETED',
        } });
        if (!performed) throw new ForbiddenError('REVIEW_NOT_ACCESSIBLE');
      }
      success(res, review);
    } catch (err) { next(err); }
  },
};
