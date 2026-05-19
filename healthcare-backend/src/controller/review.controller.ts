import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { success, paginated } from '../helper/response.helper';
import { UnauthorizedError, BusinessError } from '../utils/stateMachine';

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

      const booking = await prisma.booking.findUnique({ where: { id: data.bookingId } });
      if (!booking || booking.customerUserId !== req.user.sub) {
        throw new BusinessError('BOOKING_NOT_ACCESSIBLE', 'You cannot review this booking');
      }
      if (booking.status !== 'COMPLETED') {
        throw new BusinessError('BOOKING_NOT_COMPLETED', 'Reviews can only be submitted for completed bookings');
      }

      const existing = await prisma.review.findFirst({
        where: { bookingId: data.bookingId, customerUserId: req.user.sub, bookingVisitId: data.bookingVisitId ?? null },
      });
      if (existing) {
        throw new BusinessError('REVIEW_ALREADY_EXISTS', 'You have already reviewed this booking/visit');
      }

      const review = await prisma.review.create({
        data: {
          bookingId: data.bookingId,
          bookingVisitId: data.bookingVisitId,
          customerUserId: req.user.sub,
          staffUserId: data.staffUserId,
          rating: data.rating,
          reviewText: data.reviewText,
          isLowRating: data.rating <= 2,
        },
      });

      success(res, review, 201);
    } catch (err) { next(err); }
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
};
