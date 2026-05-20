import { Prisma } from '@prisma/client';

// Redact sensitive fields from arbitrary objects before persisting to logs or
// audit storage. SRS §11.6 — passwords, tokens, OTP codes, and card numbers
// must never appear in logs.
const REDACTED_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'tempPassword',
  'token',
  'refreshToken',
  'accessToken',
  'otp',
  'pin',
  'cvv',
  'cardNumber',
]);

export function redact(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object') {
    return value as Prisma.InputJsonValue;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redact(v)) as Prisma.InputJsonValue;
  }
  const out: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = redact(val);
  }
  return out;
}
