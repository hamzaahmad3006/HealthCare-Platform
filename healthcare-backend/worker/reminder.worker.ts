import '../src/config/env';
import { Queue } from 'bullmq';
import { prisma } from '../src/config/database';
import { redis } from '../src/config/redis';
import { renderTemplate } from '../src/helper/template.helper';
import { logger } from '../src/utils/logger';

const notificationQueue = new Queue('notifications', { connection: redis });

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

    const rendered = renderTemplate('VISIT_REMINDER', {
      bookingNumber: visit.booking.bookingNumber,
      staffName,
    });

    const notifLog = await prisma.notificationLog.create({
      data: {
        bookingId: visit.bookingId,
        bookingVisitId: visit.id,
        templateCode: 'VISIT_REMINDER',
        recipient: whatsappNumber,
        renderedContent: rendered,
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

// Run immediately on start, then every 15 minutes
sendVisitReminders().catch((err: Error) => logger.error('Reminder run failed', { err: err.message }));

setInterval(() => {
  sendVisitReminders().catch((err: Error) => logger.error('Reminder run failed', { err: err.message }));
}, CRON_INTERVAL_MS);

logger.info('⏰ Reminder worker started — running every 15 minutes');
