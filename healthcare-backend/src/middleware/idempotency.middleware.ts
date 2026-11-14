import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { BadRequestError, UnauthorizedError } from '../utils/stateMachine';

// Authentication runs before this middleware. Never replay a shared cache entry:
// booking creation persists its request record atomically with the booking in DB.
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-idempotency-key'];
  if (key === undefined) { next(); return; } // Preserve older clients without keys.
  if (!req.user) { next(new UnauthorizedError('UNAUTHENTICATED')); return; }
  if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(key)) {
    next(new BadRequestError('INVALID_IDEMPOTENCY_KEY', 'Use a key of 1–128 letters, digits, hyphens or underscores.'));
    return;
  }
  res.locals['bookingIdempotencyScope'] = createHash('sha256')
    .update(JSON.stringify(['booking:create:v1', req.user.sub, req.user.role, key])).digest('hex');
  next();
}
