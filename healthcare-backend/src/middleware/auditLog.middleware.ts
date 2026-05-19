import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Redact sensitive fields from the request body before persisting to the audit log.
// SRS §11.6 — passwords, tokens, OTP codes, and card numbers must never appear in logs.
const REDACTED_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'otp',
  'pin',
  'cvv',
  'cardNumber',
]);

function redact(value: unknown): Prisma.InputJsonValue {
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

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!AUDITED_METHODS.has(req.method)) {
    next();
    return;
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const actorUserId = req.user?.sub ?? null;
    const pathParts = req.path.split('/').filter(Boolean);

    const entityType = pathParts[1] ?? 'unknown';
    const entityId = pathParts[2] ?? 'unknown';

    prisma.auditLog
      .create({
        data: {
          actorUserId,
          entityType,
          entityId,
          action: req.method,
          payload: redact(req.body),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      })
      .catch((err: Error) => {
        logger.error('Audit log write failed', { err: err.message });
      });
  });

  next();
}
