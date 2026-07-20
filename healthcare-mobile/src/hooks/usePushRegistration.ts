import { useEffect } from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { api } from '../api/client';
import { API } from '../api/endpoints';
import { useAppSelector } from '../store';
import { getDeviceId } from '../utils/deviceId';
import { ensureNotificationPermission } from '../utils/notificationPermission';
import { navigateToNotification, type NotificationRouteData } from '../utils/notificationNavigation';
import { showForegroundBanner } from '../utils/foregroundBanner';

function toRouteData(msg: FirebaseMessagingTypes.RemoteMessage): NotificationRouteData {
  const data = (msg.data ?? {}) as Record<string, string | undefined>;
  return {
    templateCode: data['templateCode'] ?? '',
    bookingId: data['bookingId'] ?? null,
    bookingVisitId: data['bookingVisitId'] ?? null,
  };
}

async function registerToken(): Promise<void> {
  try {
    await ensureNotificationPermission();
    // Register the token even if permission was denied — the token is still
    // valid and the user may enable notifications later in OS settings without
    // needing to log in again.
    const fcmToken = await messaging().getToken();
    if (!fcmToken) return;
    const deviceId = await getDeviceId();
    await api.post(API.NOTIFICATIONS.REGISTER_DEVICE, {
      fcmToken,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceId,
    });
  } catch {
    // Best-effort — a failed registration must never block the app. Retried on
    // next login / token refresh.
  }
}

// Registers this device for push whenever a user is signed in, wires token
// refresh, and routes foreground/background/terminated notification taps to the
// right screen. Mounted once (see PushManager). Push is a delivery signal only —
// screens always refetch from the backend.
export function usePushRegistration(): void {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;

  // Register + keep token fresh while signed in.
  useEffect(() => {
    if (!role) return;
    registerToken();
    const unsubscribeRefresh = messaging().onTokenRefresh(() => {
      registerToken();
    });
    return unsubscribeRefresh;
  }, [role]);

  // Foreground messages → in-app banner (tap navigates).
  useEffect(() => {
    if (!role) return;
    const unsubscribe = messaging().onMessage((msg) => {
      const notification = msg.notification;
      if (!notification) return;
      showForegroundBanner({
        title: notification.title ?? 'HealthHome',
        body: notification.body ?? '',
        data: toRouteData(msg),
      });
    });
    return unsubscribe;
  }, [role]);

  // Tap while backgrounded, and cold-start from a terminated-state tap.
  useEffect(() => {
    if (!role) return;
    const unsubscribeOpened = messaging().onNotificationOpenedApp((msg) => {
      navigateToNotification(role, toRouteData(msg));
    });
    messaging()
      .getInitialNotification()
      .then((msg) => {
        if (msg) navigateToNotification(role, toRouteData(msg));
      })
      .catch(() => undefined);
    return unsubscribeOpened;
  }, [role]);
}
