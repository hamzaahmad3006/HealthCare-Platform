import { navigationRef } from '../navigation/navigationRef';
import type { UserRole } from '../types/auth.types';

// Routing metadata carried by both a push `data` payload and an in-app
// AppNotification row. All fields are strings (FCM constraint); empty string
// means "absent".
export interface NotificationRouteData {
  templateCode: string;
  bookingId?: string | null;
  bookingVisitId?: string | null;
}

// Resolves a notification to a destination and navigates there via the root
// navigation ref. Safe to call from outside the React tree (push tap in
// background/terminated) and from inside a screen (in-app row tap). No-ops if
// navigation isn't ready yet or the role has no sensible target.
//
// Mobile can route to a specific VisitDetail (a screen that exists here but not
// on web, where staff notifications only reach the /staff/visits list) — this
// table is intentionally richer than the web buildLink() equivalent.
export function navigateToNotification(role: UserRole, data: NotificationRouteData): void {
  if (!navigationRef.isReady()) return;

  const bookingId = data.bookingId || undefined;
  const bookingVisitId = data.bookingVisitId || undefined;

  if (role === 'CUSTOMER') {
    if (data.templateCode === 'REPORT_AVAILABLE') {
      navigationRef.navigate('Customer', { screen: 'Tabs', params: { screen: 'Reports' } });
      return;
    }
    if (bookingId) {
      navigationRef.navigate('Customer', { screen: 'BookingDetail', params: { id: bookingId } });
      return;
    }
    navigationRef.navigate('Customer', { screen: 'Tabs', params: { screen: 'Bookings' } });
    return;
  }

  if (role === 'STAFF') {
    if (bookingVisitId) {
      navigationRef.navigate('Staff', { screen: 'VisitDetail', params: { id: bookingVisitId } });
      return;
    }
    navigationRef.navigate('Staff', { screen: 'Tabs', params: { screen: 'Visits' } });
    return;
  }

  // ADMIN never reaches a mobile navigator (blocked at login) — nothing to do.
}
