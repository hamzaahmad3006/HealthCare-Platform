import '../src/config/env';
import { Worker, Queue } from 'bullmq';
import type Redis from 'ioredis';
import { prisma } from '../src/config/database';
import { redis, usingRedis } from '../src/config/redis';
import { sendWhatsAppMessage } from '../src/helper/axios';
import { logger } from '../src/utils/logger';

// Core notification dispatch. Shared by the BullMQ worker (when Redis is
// available) and by the in-process inline path (when it isn't).
async function processNotification(notificationLogId: string): Promise<void> {
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

    // 4xx is a permanent failure — do not retry.
    if (status && status >= 400 && status < 500) {
      await prisma.notificationLog.update({
        where: { id: notificationLogId },
        data: { status: 'FAILED' },
      });
      logger.error('Notification permanently failed (4xx)', { notificationLogId, status, message });
      return;
    }

    // 5xx or network — rethrow so BullMQ retries with backoff. In no-Redis
    // mode there is no retry; we log and swallow.
    if (usingRedis) {
      logger.warn('Notification failed — will retry', { notificationLogId, status, message });
      throw err;
    }
    logger.warn('Notification failed (no retry in no-redis mode)', { notificationLogId, status, message });
  }
}

interface NotificationQueueLike {
  add(name: string, data: { notificationLogId: string }): Promise<unknown>;
}

function createInlineQueue(): NotificationQueueLike {
  return {
    async add(_name, data) {
      // Fire-and-forget so callers (controllers) don't block on WhatsApp I/O.
      // Errors are logged inside processNotification.
      void processNotification(data.notificationLogId).catch((err: Error) => {
        logger.error('Inline notification dispatch failed', { err: err.message });
      });
      return null;
    },
  };
}

export const notificationQueue: NotificationQueueLike = usingRedis
  ? new Queue('notifications', {
      connection: redis as Redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    })
  : createInlineQueue();

// Spin up the BullMQ consumer only when Redis is configured. In no-Redis mode
// processing happens inline at .add() time, so a worker would be redundant.
if (usingRedis) {
  const worker = new Worker(
    'notifications',
    async (job) => {
      const { notificationLogId } = job.data as { notificationLogId: string };
      await processNotification(notificationLogId);
    },
    {
      connection: redis as Redis,
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.debug('Notification job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('Notification job failed', { jobId: job?.id, err: err.message });
  });

  logger.info('📬 Notification worker started (BullMQ)');
} else {
  logger.info('📬 Notification dispatch running inline (no Redis)');
}
