import { FirebaseNotificationService } from './firebase.service';
import type { NotificationService } from './notification.service';

// ─── Provider swap point ─────────────────────────────────────────────────────
// This one line is the entire seam between the app and its push provider. To
// migrate to AWS SNS / OneSignal / Azure Notification Hubs, implement the
// NotificationService interface in a new class (e.g. sns.service.ts) and change
// only this assignment. No caller — pushDispatch.ts or otherwise — changes.
export const notificationService: NotificationService = new FirebaseNotificationService();

export type { NotificationService, PushMessage, SendResult } from './notification.service';
