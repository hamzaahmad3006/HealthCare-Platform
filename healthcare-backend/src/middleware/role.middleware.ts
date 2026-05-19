import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../utils/stateMachine';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('UNAUTHENTICATED', 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          'INSUFFICIENT_ROLE',
          `Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        ),
      );
      return;
    }

    next();
  };
}

export const adminOnly = requireRole(Role.ADMIN);
export const staffOnly = requireRole(Role.STAFF);
export const customerOnly = requireRole(Role.CUSTOMER);
export const adminOrStaff = requireRole(Role.ADMIN, Role.STAFF);
export const adminOrCustomer = requireRole(Role.ADMIN, Role.CUSTOMER);
