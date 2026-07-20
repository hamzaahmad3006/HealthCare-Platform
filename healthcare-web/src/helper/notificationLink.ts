// Maps a notification (role + templateCode + bookingId) to an in-app route.
// Shared by NotificationBell (in-app dropdown) and usePushRegistration
// (foreground toast click). The service worker's notificationclick handler in
// public/firebase-messaging-sw.js reimplements this same table (it can't import
// modules) — keep the two in sync.
export function buildNotificationLink(
  role: string | undefined,
  templateCode: string,
  bookingId: string | null,
): string | null {
  if (!bookingId) return null;
  if (role === 'CUSTOMER') {
    return templateCode === 'REPORT_AVAILABLE' ? '/my-reports' : `/my-bookings/${bookingId}`;
  }
  if (role === 'ADMIN') return `/admin/bookings/${bookingId}`;
  if (role === 'STAFF') return '/staff/visits';
  return null;
}
