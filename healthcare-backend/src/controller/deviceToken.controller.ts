import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { NotFoundError, UnauthorizedError } from '../utils/stateMachine';
import { pickParam } from '../helper/request.helper';

const RegisterSchema = z.object({
  fcmToken: z.string().min(1).max(255),
  platform: z.enum(['ANDROID', 'IOS', 'WEB']),
  deviceId: z.string().min(1).max(255),
});

export const deviceTokenController = {
  // Register or refresh the FCM token for the caller's device. Idempotent:
  // upsert keyed on (userId, deviceId) so token rotation on the same device
  // updates in place, and multiple devices per user each get their own row.
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const { fcmToken, platform, deviceId } = RegisterSchema.parse(req.body);
      const userId = req.user.sub;

      // If this exact token was previously registered to a different user (same
      // physical device handed off / OS-reassigned token), detach it first so the
      // fcmToken unique constraint doesn't collide.
      await prisma.deviceToken.deleteMany({
        where: { fcmToken, userId: { not: userId } },
      });

      const row = await prisma.deviceToken.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        update: { fcmToken, platform, role: req.user.role },
        create: { userId, role: req.user.role, platform, fcmToken, deviceId },
        select: { id: true },
      });

      success(res, { id: row.id }, 201);
    } catch (err) {
      next(err);
    }
  },

  // Remove a device token (e.g. "sign out this device"). Ownership-checked.
  async unregister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const { count } = await prisma.deviceToken.deleteMany({
        where: { id: pickParam(req, 'id'), userId: req.user.sub },
      });
      if (count === 0) throw new NotFoundError('DEVICE_TOKEN_NOT_FOUND');
      success(res, { message: 'Device token removed' });
    } catch (err) {
      next(err);
    }
  },
};
