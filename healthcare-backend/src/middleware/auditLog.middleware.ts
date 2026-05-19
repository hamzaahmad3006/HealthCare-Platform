import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { redact } from '../helper/redact.helper';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

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
