import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { success, paginated } from '../helper/response.helper';
import {
  describeAuditOperation,
  classifyLocationTag,
} from '../helper/auditPrivacy.helper';
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
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER', 'SYSTEM']).optional(),
  action: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(30),
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
      const {
        entityType,
        actorUserId,
        role,
        action,
        search,
        fromDate,
        toDate,
        page,
        limit,
      } = AuditLogQuerySchema.parse(req.query);

      const andFilters: Prisma.AuditLogWhereInput[] = [];

      if (fromDate) {
        const parsedFrom = new Date(
          fromDate.includes('T') ? fromDate : `${fromDate}T00:00:00.000`,
        );
        if (!Number.isNaN(parsedFrom.getTime())) {
          andFilters.push({ createdAt: { gte: parsedFrom } });
        }
      }

      if (toDate) {
        const parsedTo = new Date(
          toDate.includes('T') ? toDate : `${toDate}T23:59:59.999`,
        );
        if (!Number.isNaN(parsedTo.getTime())) {
          andFilters.push({ createdAt: { lte: parsedTo } });
        }
      }

      if (entityType) {
        if (entityType === 'DEVICE_TOKEN') {
          andFilters.push({ entityType: { in: ['DEVICE_TOKEN', 'UNKNOWN'] } });
        } else if (entityType === 'SECURITY') {
          andFilters.push({
            OR: [
              { entityType: { in: ['USER', 'SECURITY', 'DEVICE_TOKEN', 'UNKNOWN'] } },
              {
                action: {
                  in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'DELETE'],
                },
              },
            ],
          });
        } else {
          andFilters.push({ entityType });
        }
      }

      if (actorUserId) {
        andFilters.push({ actorUserId });
      }

      if (role) {
        if (role === 'SYSTEM') {
          andFilters.push({ actorUserId: null });
        } else {
          andFilters.push({ actor: { role } });
        }
      }

      if (action) {
        if (action === 'SECURITY') {
          andFilters.push({
            OR: [
              {
                action: {
                  in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'DELETE'],
                },
              },
              { entityType: { in: ['USER', 'SECURITY'] } },
            ],
          });
        } else {
          andFilters.push({ action });
        }
      }

      if (search && search.trim()) {
        const q = search.trim();
        andFilters.push({
          OR: [
            { actor: { fullName: { contains: q, mode: 'insensitive' } } },
            { ipAddress: { contains: q, mode: 'insensitive' } },
            { entityType: { contains: q, mode: 'insensitive' } },
            { entityId: { contains: q, mode: 'insensitive' } },
            { action: { contains: q, mode: 'insensitive' } },
          ],
        });
      }

      const where: Prisma.AuditLogWhereInput =
        andFilters.length > 0 ? { AND: andFilters } : {};

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const [
        logs,
        total,
        totalEvents,
        todayEvents,
        clinicalBookingEvents,
        securityEvents,
        recentFailedLogins,
      ] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          include: { actor: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
        prisma.auditLog.count(),
        prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.auditLog.count({
          where: {
            entityType: {
              in: ['BOOKING', 'VISIT', 'PATIENT', 'REPORT', 'REVIEW', 'ADDRESS'],
            },
          },
        }),
        prisma.auditLog.count({
          where: {
            OR: [
              { entityType: { in: ['USER', 'SECURITY', 'DEVICE_TOKEN', 'UNKNOWN'] } },
              {
                action: {
                  in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'DELETE'],
                },
              },
            ],
          },
        }),
        prisma.auditLog.findMany({
          where: {
            createdAt: { gte: oneHourAgo },
            action: {
              in: ['LOGIN_FAILED', 'ACCOUNT_LOCKED', 'SUSPICIOUS_ACTIVITY', 'DELETE'],
            },
          },
          include: { actor: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      // Group recent failed login attempts by IP within 5-minute window & 1-hour window
      const ipBurstMap = new Map<
        string,
        {
          count5m: number;
          count1h: number;
          lastSeenAt: Date;
          hasLockout: boolean;
          actorName: string | null;
        }
      >();

      for (const evt of recentFailedLogins) {
        if (evt.action === 'DELETE') continue;
        const ip = evt.ipAddress ?? 'unknown';
        const cur = ipBurstMap.get(ip) ?? {
          count5m: 0,
          count1h: 0,
          lastSeenAt: evt.createdAt,
          hasLockout: false,
          actorName: evt.actor?.fullName ?? null,
        };
        cur.count1h += 1;
        if (evt.createdAt >= fiveMinutesAgo) {
          cur.count5m += 1;
        }
        if (evt.action === 'ACCOUNT_LOCKED' || evt.action === 'SUSPICIOUS_ACTIVITY') {
          cur.hasLockout = true;
        }
        ipBurstMap.set(ip, cur);
      }

      const securityAlerts: Array<{
        id: string;
        title: string;
        message: string;
        ipAddress: string;
        attemptCount: number;
        lastSeenAt: string;
        severity: 'CRITICAL' | 'WARNING';
      }> = [];

      for (const [ip, stats] of ipBurstMap.entries()) {
        if (stats.count5m >= 5 || stats.hasLockout || stats.count1h >= 3) {
          const isCritical = stats.count5m >= 5 || stats.hasLockout;
          securityAlerts.push({
            id: `alert-${ip}`,
            title: isCritical
              ? '🚨 RED SECURITY ALERT: Brute-Force Login Spike'
              : '⚠️ Security Notice: Repeated Failed Login Attempts',
            message: `${
              stats.count5m >= 5 ? `${stats.count5m} failed logins in 5 mins` : `${stats.count1h} failed logins in the last hour`
            } detected from IP ${ip}${stats.actorName ? ` (Target: ${stats.actorName})` : ''}.`,
            ipAddress: ip,
            attemptCount: Math.max(stats.count5m, stats.count1h),
            lastSeenAt: stats.lastSeenAt.toISOString(),
            severity: isCritical ? 'CRITICAL' : 'WARNING',
          });
        }
      }

      const enrichedLogs = logs.map((row) => {
        const rawPayload =
          row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
            ? (row.payload as Record<string, unknown>)
            : { valuesOmitted: true, fieldCount: 0 };

        let resolvedEntityType = row.entityType;
        if (resolvedEntityType === 'UNKNOWN') {
          resolvedEntityType =
            Number(rawPayload['fieldCount'] ?? 0) === 3 ? 'DEVICE_TOKEN' : 'SYSTEM';
        }

        const defaultLocation = classifyLocationTag(row.ipAddress);
        const defaultDevice =
          resolvedEntityType === 'DEVICE_TOKEN'
            ? 'Mobile / Web Push Client'
            : row.actor?.role === 'STAFF'
            ? 'Staff Portal · Web/Mobile'
            : row.actor?.role === 'CUSTOMER'
            ? 'Customer App · Web/Mobile'
            : row.actor?.role === 'ADMIN'
            ? 'Admin Console · Chrome'
            : 'System Auth Service';

        let payload = { ...rawPayload };
        if (typeof payload['operation'] !== 'string') {
          if (row.entityType === 'UNKNOWN' && Number(rawPayload['fieldCount'] ?? 0) === 3) {
            payload = {
              ...payload,
              actionCode: 'DEVICE_REGISTERED',
              operation: 'Push Notification Device Synced',
              category: 'SECURITY',
              severity: 'INFO',
              endpoint: 'POST /device-tokens',
              changedFields: ['token', 'platform', 'deviceId'],
              statusCode: 200,
              hipaaRedacted: true,
              deviceTag: defaultDevice,
              locationTag: defaultLocation,
            };
          } else if (resolvedEntityType === 'USER' && !row.actorUserId) {
            const fc = Number(rawPayload['fieldCount'] ?? 0);
            payload = {
              ...payload,
              actionCode: fc === 2 ? 'USER_LOGIN' : 'SESSION_REFRESHED',
              operation:
                fc === 2
                  ? 'User Authentication Login'
                  : 'Auth Session Token Refreshed',
              category: 'SECURITY',
              severity: 'INFO',
              endpoint: fc === 2 ? 'POST /auth/login' : 'POST /auth/refresh',
              changedFields: fc === 2 ? ['phone', 'password'] : [],
              statusCode: 200,
              hipaaRedacted: true,
              deviceTag: defaultDevice,
              locationTag: defaultLocation,
            };
          } else {
            const derived = describeAuditOperation(
              row.action,
              `/${resolvedEntityType.toLowerCase()}s`,
              resolvedEntityType,
              null,
              200,
              undefined,
              row.ipAddress,
            );
            payload = {
              ...payload,
              ...derived,
              deviceTag:
                typeof payload['deviceTag'] === 'string'
                  ? payload['deviceTag']
                  : defaultDevice,
              locationTag:
                typeof payload['locationTag'] === 'string'
                  ? payload['locationTag']
                  : defaultLocation,
            };
          }
        } else {
          if (typeof payload['deviceTag'] !== 'string') {
            payload['deviceTag'] = defaultDevice;
          }
          if (typeof payload['locationTag'] !== 'string') {
            payload['locationTag'] = defaultLocation;
          }
        }

        return {
          ...row,
          entityType: resolvedEntityType,
          payload,
        };
      });

      res.status(200).json({
        success: true,
        data: enrichedLogs,
        meta: {
          total,
          page,
          limit,
          hasNext: page * limit < total,
        },
        summary: {
          totalEvents,
          todayEvents,
          clinicalBookingEvents,
          securityEvents,
          securityAlerts,
        },
      });
    } catch (err) {
      next(err);
    }
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
