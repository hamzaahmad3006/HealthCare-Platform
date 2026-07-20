/* Firebase Cloud Messaging service worker — background push + notification taps.
 *
 * Served from the site root (/firebase-messaging-sw.js) because it lives in
 * public/. A service worker here cannot import ES modules, so the Firebase
 * config and the deep-link table are duplicated (compat SDK via importScripts).
 * Keep in sync with:
 *   - src/config/firebase.ts        (firebaseConfig)
 *   - src/helper/notificationLink.ts (buildNotificationLink)
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA9acLlUI5tKTx4WCdWOFH8yoKi-gZ3nFo',
  authDomain: 'health-home-a09b2.firebaseapp.com',
  projectId: 'health-home-a09b2',
  storageBucket: 'health-home-a09b2.firebasestorage.app',
  messagingSenderId: '166016922144',
  appId: '1:166016922144:web:55719402adc809ec168245',
});

const messaging = firebase.messaging();

// Take control of open pages as soon as this SW activates, so foreground
// onMessage forwarding and notification taps work on the first session (without
// requiring a manual reload after the very first registration).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Mirror of src/helper/notificationLink.ts — keep in sync.
function buildNotificationLink(role, templateCode, bookingId) {
  if (!bookingId) return null;
  if (role === 'CUSTOMER') {
    return templateCode === 'REPORT_AVAILABLE' ? '/my-reports' : '/my-bookings/' + bookingId;
  }
  if (role === 'ADMIN') return '/admin/bookings/' + bookingId;
  if (role === 'STAFF') return '/staff/visits';
  return null;
}

// Background message → render a tray notification. (When the tab is foreground,
// onMessage in the app handles it instead and this does not fire.)
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = (payload.notification && payload.notification.title) || 'HomeHealth';
  const body = (payload.notification && payload.notification.body) || '';
  self.registration.showNotification(title, {
    body,
    icon: '/assets/logo-icon.jpg',
    data,
  });
});

// Tap → focus an existing tab (navigating it to the deep-link) or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = buildNotificationLink(data.role, data.templateCode, data.bookingId) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
