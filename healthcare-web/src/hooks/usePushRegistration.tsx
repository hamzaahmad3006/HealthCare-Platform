import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { onMessage, type MessagePayload } from 'firebase/messaging';
import { api } from '../helper/axios';
import { API } from '../constant/apiUrls';
import { useAppSelector } from '../redux/store';
import { getFcmToken, getMessagingIfSupported } from '../config/firebase';
import { getWebDeviceId } from '../helper/webDeviceId';
import { buildNotificationLink } from '../helper/notificationLink';

let swRegistration: ServiceWorkerRegistration | null = null;

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  if (swRegistration) return swRegistration;
  try {
    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return swRegistration;
  } catch {
    return null;
  }
}

async function registerToken(): Promise<void> {
  try {
    if (!('Notification' in window)) return;
    // Request permission (idempotent — resolves immediately if already decided).
    const permission = await Notification.requestPermission();
    const reg = await registerServiceWorker();
    if (!reg) return;
    // getToken requires granted permission; if not granted the user can enable
    // notifications later and re-login to register.
    if (permission !== 'granted') return;
    const fcmToken = await getFcmToken(reg);
    if (!fcmToken) return;
    await api.post(API.NOTIFICATIONS.REGISTER_DEVICE, {
      fcmToken,
      platform: 'WEB',
      deviceId: getWebDeviceId(),
    });
  } catch {
    // Best-effort — never block the app on push registration.
  }
}

// Registers this browser for push whenever a user is signed in (covers both a
// fresh login and a page-reload rehydrate, since both set auth.user), and shows
// a clickable toast for foreground messages. Mounted once (see PushManager).
// Push is a delivery signal only — screens always refetch from the backend.
export function usePushRegistration(): void {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;
  const navigate = useNavigate();
  // Keep the latest navigate/role in refs so the onMessage handler (subscribed
  // once) never uses a stale closure.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    if (!role) return;
    void registerToken();
  }, [role]);

  useEffect(() => {
    if (!role) return;
    let unsub: (() => void) | undefined;
    void (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;
      unsub = onMessage(messaging, (payload: MessagePayload) => {
        const data = payload.data ?? {};
        const title = payload.notification?.title ?? 'HomeHealth';
        const body = payload.notification?.body ?? '';
        const url = buildNotificationLink(
          roleRef.current,
          data['templateCode'] ?? '',
          data['bookingId'] || null,
        );
        toast(
          (t) => (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                if (url) navigateRef.current(url);
              }}
              style={{
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                color: 'inherit',
                cursor: url ? 'pointer' : 'default',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>{title}</div>
              <div style={{ opacity: 0.9 }}>{body}</div>
            </button>
          ),
          { duration: 6000 },
        );
      });
    })();
    return () => unsub?.();
  }, [role]);
}
