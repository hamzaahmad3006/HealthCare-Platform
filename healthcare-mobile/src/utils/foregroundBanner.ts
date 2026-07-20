import type { NotificationRouteData } from './notificationNavigation';

// Minimal module-level pub/sub bridging the push foreground handler (which fires
// outside React) to the in-app <NotificationBanner /> component. One listener —
// the mounted banner registers itself; the push hook calls showForegroundBanner.

export interface ForegroundBannerPayload {
  title: string;
  body: string;
  data: NotificationRouteData;
}

type Listener = (payload: ForegroundBannerPayload) => void;

let listener: Listener | null = null;

export function setForegroundBannerListener(next: Listener | null): void {
  listener = next;
}

export function showForegroundBanner(payload: ForegroundBannerPayload): void {
  listener?.(payload);
}
