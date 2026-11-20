import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  auditPayloadSummary,
  auditResource,
  auditUserAgent,
  describeAuditOperation,
} from '../helper/auditPrivacy.helper';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!AUDITED_METHODS.has(req.method) || req.path.endsWith('/location')) {
    next();
    return;
  }

  const rawPath = req.path;
  const resource = auditResource(rawPath);
  const basePayload = auditPayloadSummary(req.body);
  const userAgent = auditUserAgent(req.headers['user-agent']);

  res.on('finish', () => {
    const forceSecurityLog = res.locals['auditForceLog'] === true;
    if (res.statusCode >= 400 && !forceSecurityLog) return;

    const actorUserId =
      req.user?.sub ??
      (typeof res.locals['auditActorId'] === 'string' ? res.locals['auditActorId'] : null);
    const entityId =
      typeof res.locals['auditEntityId'] === 'string'
        ? res.locals['auditEntityId']
        : resource.entityId;
    const customAction =
      typeof res.locals['auditAction'] === 'string' ? res.locals['auditAction'] : req.method;

    const opMeta = describeAuditOperation(
      customAction,
      rawPath,
      resource.entityType,
      req.body,
      res.statusCode,
      req.headers['user-agent'],
      req.ip,
    );

    prisma.auditLog
      .create({
        data: {
          actorUserId,
          entityType: resource.entityType,
          entityId,
          action: customAction,
          payload: {
            ...basePayload,
            ...opMeta,
          },
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

