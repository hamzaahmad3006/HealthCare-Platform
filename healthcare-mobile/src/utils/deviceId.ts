import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../api/client';

// Stable per-install device identifier for push token registration. Generated
// once and persisted so it survives FCM token rotation (the token changes; the
// deviceId stays, keying the DeviceToken row's (userId, deviceId) upsert). Not
// security-sensitive — a non-crypto random is sufficient for uniqueness per
// install, avoiding a uuid dependency (which needs a crypto polyfill on RN).
function generate(): string {
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand()}-${rand()}`;
}

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existing) {
    cached = existing;
    return existing;
  }
  const created = generate();
  await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, created);
  cached = created;
  return created;
}
