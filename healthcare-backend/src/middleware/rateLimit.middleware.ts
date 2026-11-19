import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { RATE_LIMIT } from '../utils/constants';
import { AppError } from '../utils/stateMachine';

async function slidingWindowLimit(
  key: string,
  max: number,
  windowSeconds: number,
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const redisKey = `ratelimit:${key}`;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now, `${now}-${crypto.randomBytes(4).toString('hex')}`);
    pipeline.zcard(redisKey);
    pipeline.expire(redisKey, windowSeconds);

    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number ?? 0;

    if (count > max) {
      next(new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
      return;
    }

    next();
  } catch {
    next();
  }
}

export function authLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `auth:${req.path}:${req.ip ?? 'unknown'}`;
  slidingWindowLimit(key, RATE_LIMIT.AUTH_MAX, RATE_LIMIT.AUTH_WINDOW_SECONDS, req, res, next).catch(next);
}

export function apiLimiter(req: Request, res: Response, next: NextFunction): void {
  // Auth endpoints already enforce their own dedicated `authLimiter`; don't let
  // general dashboard/polling traffic lock out `/auth/login` or `/auth/refresh`.
  if (req.path.startsWith('/auth')) {
    next();
    return;
  }
  let subject = req.user?.sub;
  if (!subject) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token) {
        subject = `tok:${crypto.createHash('sha256').update(token).digest('hex').slice(0, 16)}`;
      }
    }
  }
  const userId = subject ?? req.ip ?? 'anonymous';
  const key = `api:${userId}`;
  slidingWindowLimit(key, RATE_LIMIT.API_MAX, RATE_LIMIT.API_WINDOW_SECONDS, req, res, next).catch(next);
}

export function uploadLimiter(req: Request, res: Response, next: NextFunction): void {
  const userId = req.user?.sub ?? req.ip ?? 'anonymous';
  const key = `upload:${userId}`;
  slidingWindowLimit(key, RATE_LIMIT.UPLOAD_MAX, RATE_LIMIT.UPLOAD_WINDOW_SECONDS, req, res, next).catch(next);
}

// Webhook limit: protect Stripe endpoint from brute-force replay attempts.
// Stripe signs each request — invalid signatures throw inside the controller,
// but unauthenticated callers must be rate-limited at the network edge.
export function webhookLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = `webhook:${req.ip ?? 'unknown'}`;
  slidingWindowLimit(key, RATE_LIMIT.WEBHOOK_MAX, RATE_LIMIT.WEBHOOK_WINDOW_SECONDS, req, res, next).catch(next);
}
