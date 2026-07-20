import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, type Messaging } from 'firebase/messaging';

// Firebase web app config. These are PUBLIC client values (they ship in every
// web bundle by design) — safe to commit. The same values are duplicated in
// public/firebase-messaging-sw.js because a service worker in public/ cannot
// import ES modules; keep the two in sync.
export const firebaseConfig = {
  apiKey: 'AIzaSyA9acLlUI5tKTx4WCdWOFH8yoKi-gZ3nFo',
  authDomain: 'health-home-a09b2.firebaseapp.com',
  projectId: 'health-home-a09b2',
  storageBucket: 'health-home-a09b2.firebasestorage.app',
  messagingSenderId: '166016922144',
  appId: '1:166016922144:web:55719402adc809ec168245',
};

// Web Push (VAPID) public key — Project Settings > Cloud Messaging > Web Push
// certificates. Public by design.
export const VAPID_KEY =
  'BLUuarA96yahyyFPbLttOWxOPcEte9dsWR8H18UB5lkgJgcUq-64XQ9wRGHqVRk4dxygk8ylpNc2pVI4ZgljCl4';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

// Retrieves the FCM registration token for this browser, wiring it to the
// already-registered service worker. Returns null when the browser doesn't
// support web push, permission is denied, or anything fails — callers treat a
// null token as "not registered" and never block on it.
export async function getFcmToken(
  swRegistration: ServiceWorkerRegistration,
): Promise<string | null> {
  try {
    if (!(await isSupported())) return null;
    if (!messaging) messaging = getMessaging(getApp());
    return await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
  } catch {
    return null;
  }
}

// Lazily returns the Messaging instance for onMessage subscriptions, or null if
// unsupported.
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (!(await isSupported())) return null;
  if (!messaging) messaging = getMessaging(getApp());
  return messaging;
}
