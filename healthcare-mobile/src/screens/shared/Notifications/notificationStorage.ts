import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend has no read/unread concept for notifications — we derive it client-side
// from the last time the user opened this screen.
const LAST_VIEWED_KEY = '@hh_notifications_last_viewed';

export async function getLastViewedAt(): Promise<number> {
  const stored = await AsyncStorage.getItem(LAST_VIEWED_KEY);
  return stored ? new Date(stored).getTime() : 0;
}

export async function markNotificationsViewedNow(): Promise<void> {
  await AsyncStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
}
