import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { auditPayloadSummary, auditResource, auditUserAgent } from '../helper/auditPrivacy.helper';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!AUDITED_METHODS.has(req.method)) {
    next();
    return;
  }

  const resource = auditResource(req.path);
  const payload = auditPayloadSummary(req.body);
  const userAgent = auditUserAgent(req.headers['user-agent']);

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const actorUserId = req.user?.sub ?? null;

    prisma.auditLog
      .create({
        data: {
          actorUserId,
          ...resource,
          action: req.method,
          payload,
          ipAddress: req.ip,
          userAgent,
        },
      })
      .catch(() => {
        logger.error('Audit log write failed');
      });
  });

  next();
}
