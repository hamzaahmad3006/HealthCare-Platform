// Provider-agnostic push-notification contract. All provider-specific code
// (Firebase today; SNS/OneSignal/Azure tomorrow) lives behind this interface —
// migrating providers means writing one new implementation class and changing
// the single export in ./index.ts. Nothing else in the app imports a provider
// SDK directly.
//
// The interface is intentionally token-scoped only: it has no concept of a
// "user" or a device registry. Resolving which tokens belong to a user, and
// pruning dead ones, is a database concern handled one layer up in
// pushDispatch.ts — so a new provider implementation only has to satisfy these
// two methods against its own token model.

export interface PushMessage {
  title: string;
  body: string;
  /** FCM data payload — every value must be a string. Carries deep-link routing
   *  metadata (templateCode, bookingId, bookingVisitId, notificationLogId). */
  data: Record<string, string>;
  /** Optional dedupe/replace key (e.g. collapse repeated reminders). */
  collapseKey?: string;
}

export interface SendResult {
  token: string;
  success: boolean;
  /** True only when the provider reports the token itself is permanently dead
   *  (unregistered / malformed). The caller deletes these DeviceToken rows.
   *  Transient errors (quota, network) must NOT set this — they must not cause
   *  token deletion. */
  invalidToken?: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationService {
  sendToToken(token: string, message: PushMessage): Promise<SendResult>;
  sendToTokens(tokens: string[], message: PushMessage): Promise<SendResult[]>;
}
