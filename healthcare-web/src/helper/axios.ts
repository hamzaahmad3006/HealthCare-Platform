import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { store } from '../redux/store';
import { setAccessToken, clearAuth } from '../redux/slices/authSlice';
import { API } from '../constant/apiUrls';

const baseURL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = store.getState().auth.accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — refresh on 401, single-flight ─────────────────────
interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const { data } = await axios.post<{
        success: true;
        data: { accessToken: string; expiresIn: number };
      }>(
        `${baseURL}${API.AUTH.REFRESH}`,
        {},
        { withCredentials: true },
      );
      const newToken = data.data.accessToken;
      store.dispatch(setAccessToken(newToken));
      return newToken;
    } catch {
      store.dispatch(clearAuth());
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    if (!original || original._retry) return Promise.reject(error);

    if (error.response?.status === 401) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
      // Refresh failed — redirect handled by ProtectedRoute on next render
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

// ── Typed error extraction helper ────────────────────────────────────────────
export interface ApiErrorShape {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export function extractApiError(err: unknown): ApiErrorShape {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: ApiErrorShape } | undefined;
    if (data?.error) return data.error;
    return { code: 'NETWORK_ERROR', message: err.message };
  }
  if (err instanceof Error) return { code: 'CLIENT_ERROR', message: err.message };
  return { code: 'UNKNOWN', message: 'An unexpected error occurred.' };
}
