import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { success, paginated } from '../helper/response.helper';
import { ADMIN_DASHBOARD_CACHE_TTL } from '../utils/constants';

const AuditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  actorUserId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const adminController = {
  async dashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'admin:dashboard:summary';
      const cached = await redis.get(cacheKey);

      if (cached) {
        success(res, JSON.parse(cached) as Record<string, unknown>);
        return;
      }

      const [
        totalBookings,
        completedBookings,
        totalStaff,
        availableStaff,
        pendingBookings,
        avgRatingResult,
      ] = await prisma.$transaction([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.staffProfile.count(),
        prisma.staffProfile.count({ where: { isAvailable: true } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.review.aggregate({ _avg: { rating: true } }),
      ]);

      const summary = {
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
        totalStaff,
        availableStaff,
        staffUtilization: totalStaff > 0 ? Math.round(((totalStaff - availableStaff) / totalStaff) * 100) : 0,
        pendingBookings,
        avgRating: avgRatingResult._avg.rating ? Number(avgRatingResult._avg.rating.toFixed(1)) : null,
      };

      await redis.set(cacheKey, JSON.stringify(summary), 'EX', ADMIN_DASHBOARD_CACHE_TTL);
      success(res, summary);
    } catch (err) { next(err); }
  },

  async staffUtilization(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await prisma.staffProfile.findMany({
        include: {
          user: { select: { fullName: true, phone: true } },
          city: { select: { name: true } },
          visits: {
            where: { status: { in: ['ASSIGNED', 'EN_ROUTE', 'CHECKED_IN', 'COMPLETED'] } },
            select: { id: true, status: true },
          },
        },
      });

      const utilization = staff.map((s) => ({
        staffUserId: s.userId,
        fullName: s.user.fullName,
        phone: s.user.phone,
        city: s.city?.name ?? null,
        staffCode: s.staffCode,
        isAvailable: s.isAvailable,
        verificationStatus: s.verificationStatus,
        totalVisits: s.visits.length,
        completedVisits: s.visits.filter((v) => v.status === 'COMPLETED').length,
      }));

      success(res, utilization);
    } catch (err) { next(err); }
  },

  async auditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, actorUserId, page, limit } = AuditLogQuerySchema.parse(req.query);

      const where = {
        ...(entityType && { entityType }),
        ...(actorUserId && { actorUserId }),
      };

      const [logs, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: { actor: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      paginated(res, logs, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },
};
