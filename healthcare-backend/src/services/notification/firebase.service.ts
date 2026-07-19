import { getMessaging, type Message } from 'firebase-admin/messaging';
import { firebaseApp } from '../../config/firebase';
import { logger } from '../../utils/logger';
import type {
  NotificationService,
  PushMessage,
  SendResult,
} from './notification.service';

// FCM error codes that mean the token is permanently dead and its DeviceToken
// row should be deleted. Anything else (quota, network, internal) is transient
// and must NOT trigger deletion.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

function toFcmMessage(token: string, message: PushMessage): Message {
  return {
    token,
    notification: { title: message.title, body: message.body },
    data: message.data,
    ...(message.collapseKey
      ? { android: { collapseKey: message.collapseKey } }
      : {}),
  };
}

function mapError(token: string, err: unknown): SendResult {
  const code = (err as { code?: string }).code;
  const messageText = err instanceof Error ? err.message : 'Unknown push error';
  return {
    token,
    success: false,
    invalidToken: code ? DEAD_TOKEN_CODES.has(code) : false,
    error: messageText,
  };
}

export class FirebaseNotificationService implements NotificationService {
  async sendToToken(token: string, message: PushMessage): Promise<SendResult> {
    if (!firebaseApp) {
      // pushEnabled is false — should be gated by callers, but stay safe.
      return { token, success: false, error: 'Firebase not configured' };
    }
    try {
      const id = await getMessaging(firebaseApp).send(toFcmMessage(token, message));
      return { token, success: true, providerMessageId: id };
    } catch (err) {
      return mapError(token, err);
    }
  }

  async sendToTokens(tokens: string[], message: PushMessage): Promise<SendResult[]> {
    if (!firebaseApp || tokens.length === 0) {
      return tokens.map((token) => ({
        token,
        success: false,
        error: 'Firebase not configured',
      }));
    }

    // sendEachForMulticast is the current batch API (sendMulticast is deprecated).
    const res = await getMessaging(firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
      ...(message.collapseKey
        ? { android: { collapseKey: message.collapseKey } }
        : {}),
    });

    return res.responses.map((r, i): SendResult => {
      const token = tokens[i]!;
      if (r.success) {
        return { token, success: true, providerMessageId: r.messageId };
      }
      const result = mapError(token, r.error);
      logger.warn('FCM send failed for token', {
        code: (r.error as { code?: string })?.code,
        invalidToken: result.invalidToken,
      });
      return result;
    });
  }
}
