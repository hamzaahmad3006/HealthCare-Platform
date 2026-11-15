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

// Resolves to null (rather than throwing) on denied permission, timeout, or
// disabled GPS — callers decide whether the coordinates are required.
// Falls back to network/coarse location when high-accuracy GPS times out indoors.
export async function getCurrentCoords(): Promise<Coords | null> {
  const allowed = await ensurePermission();
  if (!allowed) return null;

  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {
        Geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 600_000 },
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}
