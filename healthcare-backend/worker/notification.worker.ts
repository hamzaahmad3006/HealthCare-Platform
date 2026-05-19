import '../src/config/env';
import { Worker, Queue } from 'bullmq';
import { prisma } from '../src/config/database';
import { redis } from '../src/config/redis';
import { sendWhatsAppMessage } from '../src/helper/axios';
import { logger } from '../src/utils/logger';

export const notificationQueue = new Queue('notifications', { connection: redis });

const worker = new Worker(
  'notifications',
  async (job) => {
    const { notificationLogId } = job.data as { notificationLogId: string };

    const log = await prisma.notificationLog.findUnique({ where: { id: notificationLogId } });
    if (!log) {
      logger.warn('NotificationLog not found', { notificationLogId });
      return;
    }

    if (log.status === 'SENT') {
      logger.debug('Notification already sent — skipping', { notificationLogId });
      return;
    }

    try {
      const result = await sendWhatsAppMessage(log.recipient, log.renderedContent);

      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: {
          status: 'SENT',
          externalMessageId: result.messageId,
          sentAt: new Date(),
        },
      });

      logger.info('Notification sent', { notificationLogId, messageId: result.messageId });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      const message = err instanceof Error ? err.message : 'Unknown error';

      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { retryCount: { increment: 1 }, providerError: message },
      });

      // 4xx = permanent failure — do not retry
      if (status && status >= 400 && status < 500) {
        await prisma.notificationLog.update({
          where: { id: notificationLogId },
          data: { status: 'FAILED' },
        });
        logger.error('Notification permanently failed (4xx)', { notificationLogId, status, message });
        return;
      }

      // 5xx — BullMQ will retry with backoff
      logger.warn('Notification failed — will retry', { notificationLogId, status, message });
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 5,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  },
);

worker.on('completed', (job) => {
  logger.debug('Notification job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('Notification job failed', { jobId: job?.id, err: err.message });
});

logger.info('📬 Notification worker started');
