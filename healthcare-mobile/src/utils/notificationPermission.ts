import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Requests OS permission to show notifications. Mirrors location.ts's lazy,
// colocated ensure-permission pattern. On Android 13+ (API 33+) this shows the
// runtime POST_NOTIFICATIONS dialog; on older Android it's granted by manifest.
// On iOS it goes through FCM's authorization request. Resolves to a boolean —
// callers decide what to do when denied (we still register a token so the user
// can enable notifications later in OS settings without re-login).
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // POST_NOTIFICATIONS only exists as a runtime permission on API 33+. On
    // older versions PermissionsAndroid returns 'granted' immediately.
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Enable notifications',
        message: 'HealthHome uses notifications to alert you about bookings, visits, and reports.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS (and as a belt-and-suspenders on Android): FCM authorization.
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}
