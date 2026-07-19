/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Background/terminated data handler. MUST be registered here — outside the
// React tree, before registerComponent — per React Native Firebase's contract.
// Our messages carry a `notification` block, so Android renders the tray
// notification automatically; this handler only needs to exist (and could do
// silent data work later). We intentionally do NOT fetch/update state here —
// the app always refetches from the backend when opened (NotificationLog is the
// source of truth), so a background push is purely a wake/tap signal.
messaging().setBackgroundMessageHandler(async () => {
  // no-op — tray display is handled by the OS from the notification payload
});

AppRegistry.registerComponent(appName, () => App);
