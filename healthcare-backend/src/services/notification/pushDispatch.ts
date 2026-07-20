import type { NotificationLog } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { renderPushContent } from '../../helper/pushTemplate.helper';
import type { TemplateCode } from '../../helper/template.helper';
import { notificationService } from './index';
import type { PushMessage } from './notification.service';

// Composition layer over the provider-agnostic NotificationService: turns a
// NotificationLog row into a push to all of the recipient user's devices, then
// prunes any tokens the provider reported as dead. This is where the DB /
// DeviceToken concern lives, so the provider interface stays pure-messaging.

export async function dispatchPush(log: NotificationLog): Promise<void> {
  if (!log.userId) return;

  const devices = await prisma.deviceToken.findMany({
    where: { userId: log.userId },
    select: { fcmToken: true, role: true },
  });
  if (devices.length === 0) return;

  const content = renderPushContent(
    log.templateCode as TemplateCode,
    (log.templateData as Record<string, string | number | undefined> | null) ?? {},
  );

  const message: PushMessage = {
    title: content.title,
    body: content.body,
    data: {
      notificationLogId: log.id,
      templateCode: log.templateCode,
      bookingId: log.bookingId ?? '',
      bookingVisitId: log.bookingVisitId ?? '',
      // Recipient role — the web service worker uses it to build the deep-link
      // (it has no app/redux context). All of a user's tokens share one role.
      role: devices[0]?.role ?? '',
    },
  };

  const tokens = devices.map((d) => d.fcmToken);
  const results = await notificationService.sendToTokens(tokens, message);

  const deadTokens = results.filter((r) => r.invalidToken).map((r) => r.token);
  if (deadTokens.length > 0) {
    await prisma.deviceToken
      .deleteMany({ where: { fcmToken: { in: deadTokens } } })
      .catch((err: Error) => logger.error('Failed to prune dead device tokens', { err: err.message }));
    logger.info('Pruned dead device tokens', { count: deadTokens.length });
  }
}
