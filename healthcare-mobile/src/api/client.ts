import { readTokens, rotateTokens, deleteTokens, tokenGeneration } from './sessionTokens';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG } from './host';
import { resolveApiBase } from './config';
import type { RetryableConfig } from '../types/client.types';

export const API_BASE = resolveApiBase(API_CONFIG, __DEV__, Platform.OS);

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@hh_access_token',
  REFRESH_TOKEN: '@hh_refresh_token',
  USER: '@hh_user',
  // Stable per-install identifier for push device-token registration. Generated
  // once, persisted; survives FCM token rotation and is sent on logout cleanup.
  DEVICE_ID: '@hh_device_id',
};

let refreshInFlight: Promise<string | null> | null = null;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = (await readTokens())?.accessToken;
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
      const version = tokenGeneration();
      const refreshToken = (await readTokens())?.refreshToken;
      if (!refreshToken) return null;

      const { data } = await axios.post<{
        success: true;
        data: { accessToken: string; refreshToken?: string; expiresIn: number };
      }>(`${API_BASE}/auth/refresh`, { refreshToken }, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      const newToken = data.data.accessToken;
      // The backend rotates the refresh token on every refresh — persist the new
      // one so the next refresh doesn't send a revoked token.
      if (!await rotateTokens(data.data, version)) return null;
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
  await Promise.all([
    deleteTokens(),
    AsyncStorage.removeItem(STORAGE_KEYS.USER),
  ]);
}

export function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: { message?: string } })?.error?.message
      ?? err.message;
  }
  return 'Something went wrong';
}
