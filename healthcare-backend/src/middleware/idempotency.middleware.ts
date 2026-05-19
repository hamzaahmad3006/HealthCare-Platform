import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { IDEMPOTENCY_TTL } from '../utils/constants';
import { logger } from '../utils/logger';

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-idempotency-key'] as string | undefined;

  if (!key) {
    next();
    return;
  }

  const redisKey = `idempotency:${key}`;

  redis
    .get(redisKey)
    .then(async (cached) => {
      if (cached) {
        const parsed = JSON.parse(cached) as Record<string, unknown>;
        res.status(200).json(parsed);
        return;
      }

      res.locals['idempotencyKey'] = key;

      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis
            .set(redisKey, JSON.stringify(body), 'EX', IDEMPOTENCY_TTL)
            .catch((err: Error) => logger.error('Idempotency cache write failed', { err: err.message }));
        }
        return originalJson(body);
      };

      next();
    })
    .catch(() => next());
}
