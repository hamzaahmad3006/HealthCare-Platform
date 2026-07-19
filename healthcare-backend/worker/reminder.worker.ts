import '../src/config/env';
import { prisma } from '../src/config/database';
import { renderTemplate } from '../src/helper/template.helper';
import { logger } from '../src/utils/logger';
import { notificationQueue } from './notification.worker';

const REMINDER_WINDOW_MINUTES = 75;
const REMINDER_THRESHOLD_MINUTES = 60;
const CRON_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function sendVisitReminders(): Promise<void> {
  logger.info('⏰ Running visit reminder check...');

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);

  const upcomingVisits = await prisma.bookingVisit.findMany({
    where: {
      status: { in: ['ASSIGNED', 'EN_ROUTE'] },
      scheduledStartAt: { gte: now, lte: windowEnd },
    },
    include: {
      booking: {
        include: {
          customer: { include: { customerProfile: true } },
        },
      },
      assignedStaff: {
        include: { user: { select: { fullName: true } } },
      },
    },
  });

  for (const visit of upcomingVisits) {
    const existingReminder = await prisma.notificationLog.findFirst({
      where: {
        bookingVisitId: visit.id,
        templateCode: 'VISIT_REMINDER',
        createdAt: { gte: new Date(now.getTime() - REMINDER_WINDOW_MINUTES * 60 * 1000) },
      },
    });

    if (existingReminder) {
      logger.debug('Reminder already sent for visit', { visitId: visit.id });
      continue;
    }

    const whatsappNumber =
      visit.booking.customer.customerProfile?.whatsappNumber ??
      null;

    if (!whatsappNumber) {
      logger.warn('No WhatsApp number for customer', { customerId: visit.booking.customerUserId });
      continue;
    }

    const staffName = visit.assignedStaff?.user.fullName ?? 'Your healthcare professional';

    const templateData = {
      bookingNumber: visit.booking.bookingNumber,
      staffName,
    };
    const rendered = renderTemplate('VISIT_REMINDER', templateData);

    const notifLog = await prisma.notificationLog.create({
      data: {
        userId: visit.booking.customerUserId,
        bookingId: visit.bookingId,
        bookingVisitId: visit.id,
        templateCode: 'VISIT_REMINDER',
        recipient: whatsappNumber,
        renderedContent: rendered,
        templateData,
        status: 'PENDING',
      },
    });

    await notificationQueue
      .add('send', { notificationLogId: notifLog.id })
      .catch((err: Error) => logger.error('Failed to enqueue reminder', { err: err.message }));

    logger.info('Visit reminder queued', { visitId: visit.id, notifLogId: notifLog.id });
  }

  logger.info(`⏰ Reminder check complete. Processed ${upcomingVisits.length} visits.`);
}

async function sendPackageRenewalAlerts(): Promise<void> {
  logger.info('📅 Running package renewal check...');

  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  // Find bookings whose last scheduled visit falls within the next 3-4 days
  const bookingsNearingEnd = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] },
      visits: {
        some: {
          scheduledStartAt: { gte: threeDaysLater, lte: fourDaysLater },
          status: { notIn: ['CANCELLED', 'MISSED'] },
        },
        every: {
          scheduledStartAt: { lte: fourDaysLater },
        },
      },
    },
    include: {
      customer: { include: { customerProfile: true } },
      package: { select: { name: true } },
    },
    take: 100,
  });

  for (const booking of bookingsNearingEnd) {
    const existingAlert = await prisma.notificationLog.findFirst({
      where: {
        bookingId: booking.id,
        templateCode: 'PACKAGE_RENEWAL',
        createdAt: { gte: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      },
    });

    if (existingAlert) continue;

    const whatsappNumber = booking.customer.customerProfile?.whatsappNumber ?? null;
    if (!whatsappNumber) continue;

    const templateData = {
      packageName: booking.package.name,
      bookingNumber: booking.bookingNumber,
    };
    const notifLog = await prisma.notificationLog.create({
      data: {
        userId: booking.customerUserId,
        bookingId: booking.id,
        templateCode: 'PACKAGE_RENEWAL',
        recipient: whatsappNumber,
        renderedContent: renderTemplate('PACKAGE_RENEWAL', templateData),
        templateData,
        status: 'PENDING',
      },
    });

    await notificationQueue
      .add('send', { notificationLogId: notifLog.id })
      .catch((err: Error) => logger.error('Failed to enqueue renewal alert', { err: err.message }));

    logger.info('Package renewal alert queued', { bookingId: booking.id });
  }
}

// Run immediately on start, then every 15 minutes
sendVisitReminders().catch((err: Error) => logger.error('Reminder run failed', { err: err.message }));
sendPackageRenewalAlerts().catch((err: Error) => logger.error('Renewal check failed', { err: err.message }));

setInterval(() => {
  sendVisitReminders().catch((err: Error) => logger.error('Reminder run failed', { err: err.message }));
}, CRON_INTERVAL_MS);

// Run renewal check once per day (every 6 hours is fine too)
setInterval(() => {
  sendPackageRenewalAlerts().catch((err: Error) => logger.error('Renewal check failed', { err: err.message }));
}, 6 * 60 * 60 * 1000);

logger.info('⏰ Reminder worker started — running every 15 minutes');
