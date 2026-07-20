const DEVICE_ID_KEY = 'hh_device_id';

// Stable per-browser identifier for push device-token registration. Generated
// once and persisted in localStorage so it survives FCM token rotation (the
// token changes; the deviceId stays, keying the DeviceToken (userId, deviceId)
// upsert). Not security-sensitive.
export function getWebDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
