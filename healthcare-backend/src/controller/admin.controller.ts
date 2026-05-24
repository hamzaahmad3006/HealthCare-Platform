import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { success, paginated } from '../helper/response.helper';
import { ADMIN_DASHBOARD_CACHE_TTL } from '../utils/constants';

function last7Days(): { date: string; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0]!,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
}

const AuditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  actorUserId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const NotificationQuerySchema = z.object({
  status: z.enum(['PENDING', 'SENT', 'FAILED']).optional(),
  templateCode: z.string().optional(),
  bookingId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
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

      const days = last7Days();
      const sevenDaysAgo = new Date(days[0]!.date + 'T00:00:00.000Z');

      const [
        totalBookings,
        completedBookings,
        totalStaff,
        availableStaff,
        pendingBookings,
        avgRatingResult,
        recentBookings,
        statusGroups,
      ] = await prisma.$transaction([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.staffProfile.count(),
        prisma.staffProfile.count({ where: { isAvailable: true } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.booking.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),
        prisma.$queryRaw<{ status: string; count: bigint }[]>`SELECT status, COUNT(*) as count FROM bookings GROUP BY status ORDER BY count DESC`,
      ]);

      // Build day-by-day trend
      const bookingsTrend = days.map(({ date, label }) => ({
        label,
        bookings: recentBookings.filter((b) => b.createdAt.toISOString().startsWith(date)).length,
      }));

      // Status breakdown
      const statusBreakdown = statusGroups.map((g) => ({
        status: g.status,
        count: Number(g.count),
      }));

      const summary = {
        totalBookings,
        completedBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
        totalStaff,
        availableStaff,
        staffUtilization: totalStaff > 0 ? Math.round(((totalStaff - availableStaff) / totalStaff) * 100) : 0,
        pendingBookings,
        avgRating: avgRatingResult._avg.rating ? Number(avgRatingResult._avg.rating.toFixed(1)) : null,
        bookingsTrend,
        statusBreakdown,
      };

      await redis.set(cacheKey, JSON.stringify(summary), 'EX', ADMIN_DASHBOARD_CACHE_TTL);
      success(res, summary);
    } catch (err) { next(err); }
  },

  async analytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'admin:analytics';
      const cached = await redis.get(cacheKey);
      if (cached) { success(res, JSON.parse(cached) as Record<string, unknown>); return; }

      const now = new Date();
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          start: new Date(d.getFullYear(), d.getMonth(), 1),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        };
      });

      const monthlyData = await Promise.all(
        months.map(async ({ start, end, label }) => {
          const [bookings, completed, payments] = await Promise.all([
            prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
            prisma.booking.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
            prisma.payment.aggregate({
              where: { status: 'PAID', paidAt: { gte: start, lte: end } },
              _sum: { amount: true },
            }),
          ]);
          return {
            label,
            bookings,
            completed,
            revenue: payments._sum.amount ? Number(payments._sum.amount) : 0,
          };
        }),
      );

      // Service type breakdown (all time)
      const serviceBreakdown = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
        SELECT st.name, COUNT(b.id) as count
        FROM bookings b
        JOIN service_types st ON b."serviceTypeId" = st.id
        GROUP BY st.name ORDER BY count DESC
      `;

      const data = {
        monthlyData,
        serviceBreakdown: serviceBreakdown.map((s) => ({ name: s.name, count: Number(s.count) })),
      };

      await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
      success(res, data);
    } catch (err) { next(err); }
  },

  async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        search: z.string().optional(),
        page:   z.coerce.number().min(1).default(1),
        limit:  z.coerce.number().min(1).max(100).default(20),
      });
      const { search, page, limit } = schema.parse(req.query);

      const where = {
        role: 'CUSTOMER' as const,
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { phone:    { contains: search, mode: 'insensitive' as const } },
            { email:    { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: {
            id: true, fullName: true, email: true, phone: true,
            status: true, createdAt: true,
            _count: { select: { bookings: true, patients: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      paginated(res, users, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },

  async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params['id']);
      const customer = await prisma.user.findFirst({
        where: { id, role: 'CUSTOMER' },
        select: {
          id: true, fullName: true, email: true, phone: true,
          status: true, createdAt: true,
          patients: {
            select: { id: true, fullName: true, dateOfBirth: true, gender: true, primaryCondition: true, allergies: true },
            orderBy: { fullName: 'asc' },
          },
          bookings: {
            select: {
              id: true, bookingNumber: true, status: true, totalPrice: true, currency: true,
              requestedStartAt: true, createdAt: true,
              serviceType: { select: { name: true } },
              package: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { bookings: true, patients: true } },
        },
      });
      if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
      success(res, customer);
    } catch (err) { next(err); }
  },

  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schema = z.object({
        status:   z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
        method:   z.enum(['CASH', 'JAZZCASH', 'STRIPE']).optional(),
        page:     z.coerce.number().min(1).default(1),
        limit:    z.coerce.number().min(1).max(100).default(20),
      });
      const { status, method, page, limit } = schema.parse(req.query);

      const where = {
        ...(status && { status }),
        ...(method && { paymentMethod: method }),
      };

      const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              select: {
                bookingNumber: true,
                customer: { select: { fullName: true, phone: true } },
                serviceType: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.payment.count({ where }),
      ]);

      paginated(res, payments, { total, page, limit, hasNext: page * limit < total });
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

  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, templateCode, bookingId, page, limit } = NotificationQuerySchema.parse(req.query);
      const where = {
        ...(status && { status }),
        ...(templateCode && { templateCode }),
        ...(bookingId && { bookingId }),
      };

      const [logs, total] = await prisma.$transaction([
        prisma.notificationLog.findMany({
          where,
          include: { booking: { select: { bookingNumber: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notificationLog.count({ where }),
      ]);

      paginated(res, logs, { total, page, limit, hasNext: page * limit < total });
    } catch (err) { next(err); }
  },
};
