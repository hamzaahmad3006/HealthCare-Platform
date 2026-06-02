import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In dev: use 10.0.2.2 for Android emulator (routes to host machine localhost)
// In prod: replace with actual API URL
export const API_BASE = __DEV__
  ? 'http://10.0.2.2:3000/api/v1'
  : 'https://api.yourdomain.com/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@hh_access_token',
  REFRESH_TOKEN: '@hh_refresh_token',
  USER: '@hh_user',
};

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryableConfig;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (newToken && original.headers) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        await clearTokens();
      }
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const { data } = await axios.post<{
        success: true;
        data: { accessToken: string; expiresIn: number };
      }>(`${API_BASE}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      const newToken = data.data.accessToken;
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
      return newToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
  ]);
}

export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: { message?: string } })?.error?.message
      ?? err.message;
  }
  return 'Something went wrong';
}
