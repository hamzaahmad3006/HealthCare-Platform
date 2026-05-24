import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError } from '../utils/stateMachine';
import { notificationQueue } from '../../worker/notification.worker';
import { pickParam } from '../helper/request.helper';

const NOTIF_SELECT = {
  id: true,
  templateCode: true,
  renderedContent: true,
  bookingId: true,
  bookingVisitId: true,
  status: true,
  sentAt: true,
  createdAt: true,
} as const;

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { role, sub } = req.user;

      const where =
        role === 'CUSTOMER'
          ? { booking: { customerUserId: sub } }
          : role === 'STAFF'
          ? { booking: { assignments: { some: { staffUserId: sub } } } }
          : {}; // ADMIN — all

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
