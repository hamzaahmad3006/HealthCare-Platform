import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Ref to the root NavigationContainer, usable from outside the React tree — e.g.
// a notification-tap handler firing while the app is backgrounded or cold-started.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
