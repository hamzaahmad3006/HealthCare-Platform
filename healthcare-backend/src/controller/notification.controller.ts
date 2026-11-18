import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { authorizedBookingWhere } from '../helper/bookingAccess.helper';
import { success } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError } from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';
import { pickParam } from '../helper/request.helper';

const NOTIF_SELECT = {
  id: true,
  templateCode: true,
  renderedContent: true,
  templateData: true,
  bookingId: true,
  bookingVisitId: true,
  status: true,
  sentAt: true,
  createdAt: true,
  userId: true,
} as const;

const ADMIN_ACTIONABLE_CODES = [
  'BOOKING_RECEIVED',
  'BOOKING_CANCELLED',
  'DOCTOR_ACCEPTED',
  'DOCTOR_TIME_ACCEPTED',
  'VISIT_COMPLETED',
  'REPORT_AVAILABLE',
];

function formatAdminNotificationContent(
  templateCode: string,
  templateData: unknown,
  fallback: string,
): string {
  const d = (templateData && typeof templateData === 'object' ? templateData : {}) as Record<
    string,
    unknown
  >;
  const bookingNo = typeof d['bookingNumber'] === 'string' ? d['bookingNumber'] : '';
  const customer = typeof d['customerName'] === 'string' ? d['customerName'] : 'Customer';
  const service = typeof d['serviceName'] === 'string' ? d['serviceName'] : 'Homecare service';
  const staff = typeof d['staffName'] === 'string' ? d['staffName'] : 'Assigned staff';
  const visitNo = d['visitNumber'] !== undefined ? String(d['visitNumber']) : '';
  const reportType = typeof d['reportType'] === 'string' ? d['reportType'] : 'Medical';
  const reason = typeof d['cancellationReason'] === 'string' ? d['cancellationReason'] : '';

  switch (templateCode) {
    case 'BOOKING_RECEIVED':
      return bookingNo
        ? `New booking #${bookingNo} by ${customer} for ${service}. Pending confirmation & staff assignment.`
        : fallback;
    case 'BOOKING_CANCELLED':
      return bookingNo
        ? `Booking #${bookingNo} (${customer}) was cancelled${reason ? `: "${reason}"` : '.'}`
        : fallback;
    case 'DOCTOR_ACCEPTED':
      return bookingNo
        ? `Visiting doctor accepted booking #${bookingNo}. Awaiting admin confirmation.`
        : fallback;
    case 'DOCTOR_TIME_ACCEPTED':
      return bookingNo
        ? `Customer accepted proposed time for booking #${bookingNo}. Awaiting admin confirmation.`
        : fallback;
    case 'VISIT_COMPLETED':
      return bookingNo
        ? `Visit${visitNo ? ` #${visitNo}` : ''} for booking #${bookingNo} completed by ${staff}.`
        : fallback;
    case 'REPORT_AVAILABLE':
      return bookingNo
        ? `${reportType} report uploaded for booking #${bookingNo} (${customer}).`
        : fallback;
    default:
      return fallback;
  }
}

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { role, sub } = req.user;
      const personalOnly = req.query['scope'] === 'personal' || req.query['personal'] === 'true';

      if (role === 'ADMIN' && personalOnly) {
        const [actionableLogs, pendingStaff] = await Promise.all([
          prisma.notificationLog.findMany({
            where: {
              OR: [
                { userId: sub },
                { templateCode: { in: ADMIN_ACTIONABLE_CODES } },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 25,
            select: NOTIF_SELECT,
          }),
          prisma.staffProfile?.findMany
            ? prisma.staffProfile.findMany({
                where: {
                  verificationStatus: 'PENDING',
                  profileCompletedAt: { not: null },
                  user: { status: 'ACTIVE', deletedAt: null },
                },
                include: {
                  user: { select: { fullName: true } },
                  city: { select: { name: true } },
                  _count: { select: { documents: true } },
                },
                orderBy: { profileCompletedAt: 'desc' },
                take: 10,
              })
            : Promise.resolve([]),
        ]);

        const staffAlerts = pendingStaff
          .filter((s) => s.profileCompletedAt !== null)
          .map((s) => ({
            id: `staff-pending-${s.userId}`,
            templateCode: 'STAFF_REVIEW_PENDING',
            renderedContent: `${s.user.fullName} (${s.staffCode}${
              s.city?.name ? ` · ${s.city.name}` : ''
            }) submitted their profile${
              s._count.documents > 0 ? ` & ${s._count.documents} document(s)` : ''
            }. Awaiting your verification.`,
            bookingId: null,
            bookingVisitId: null,
            staffUserId: s.userId,
            status: 'SENT' as const,
            sentAt: s.profileCompletedAt,
            createdAt: s.profileCompletedAt!,
            userId: sub,
          }));

        const formattedLogs = actionableLogs.map(({ templateData, ...log }) => ({
          ...log,
          staffUserId: null as string | null,
          renderedContent: formatAdminNotificationContent(
            log.templateCode,
            templateData,
            log.renderedContent,
          ),
        }));

        const combined = [...staffAlerts, ...formattedLogs]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30);

        success(res, combined);
        return;
      }

      // A personal feed contains this user's messages, not every message about
      // a booking they once worked on. Current booking access also preserves
      // eligible preferred doctors' requests before a visit is assigned.
      const where = role === 'ADMIN' ? {} : {
        userId: sub,
        OR: [
          { bookingId: null },
          { booking: await authorizedBookingWhere(req.user) },
        ],
      };

      const logs = await prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: NOTIF_SELECT,
      });

      success(res, logs);
    } catch (err) { next(err); }
  },

  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await prisma.notificationLog.findUnique({ where: { id: pickParam(req, 'id') } });
      if (!log) throw new NotFoundError('NOTIFICATION_LOG_NOT_FOUND');

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: { status: 'PENDING', retryCount: { increment: 1 }, providerError: null },
      });

      await notificationQueue.add('send', { notificationLogId: log.id });

      success(res, { message: 'Notification queued for retry' });
    } catch (err) { next(err); }
  },
};
