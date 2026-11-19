import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coords {
  latitude: number;
  longitude: number;
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission',
        message: 'HealthHome needs your location to record where a visit was checked in and out.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return new Promise((resolve) => {
    Geolocation.requestAuthorization(() => resolve(true), () => resolve(false));
  });
}

async function fetchIpCoords(): Promise<Coords | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number };
      if (data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { latitude: data.latitude, longitude: data.longitude };
      }
    }
  } catch {
    // try secondary endpoint
  }
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (res.ok) {
      const data = (await res.json()) as { latitude?: string; longitude?: string };
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Resolves to device GPS, falling back to network/coarse location and then IP
// geolocation when hardware GPS times out indoors or on an emulator.
export async function getCurrentCoords(): Promise<Coords | null> {
  const allowed = await ensurePermission().catch(() => false);

  if (allowed) {
    const deviceCoords = await new Promise<Coords | null>((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {
          Geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 600_000 },
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 },
      );
    });
    if (deviceCoords) return deviceCoords;
  }

  return fetchIpCoords();
}
