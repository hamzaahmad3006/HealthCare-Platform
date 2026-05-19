import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { NotFoundError } from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';

export const notificationController = {
  async retry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await prisma.notificationLog.findUnique({ where: { id: req.params['id'] } });
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
