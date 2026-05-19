export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

export const PRESIGN_TTL_SECONDS = 300; // 5 minutes

export const BOOKING_NUMBER_PREFIX = 'HHS';

export const ADMIN_DASHBOARD_CACHE_TTL = 60; // seconds

export const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

export const STRIPE_EVENT_DEDUP_TTL = 172800; // 48 hours in seconds

export const RATE_LIMIT = {
  AUTH_MAX: 5,
  AUTH_WINDOW_SECONDS: 60,
  API_MAX: 100,
  API_WINDOW_SECONDS: 60,
  UPLOAD_MAX: 20,
  UPLOAD_WINDOW_SECONDS: 60,
  WEBHOOK_MAX: 60,
  WEBHOOK_WINDOW_SECONDS: 60,
} as const;

export const FAILED_LOGIN_LOCKOUT = {
  MAX_ATTEMPTS: 10,
  WINDOW_MINUTES: 15,
} as const;
