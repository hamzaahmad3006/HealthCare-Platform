import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Cities + nested zones — read-only reference data. Used by:
//   - admin Add Staff form (admin role)
//   - staff /complete-profile self-onboarding (staff role)
//   - customer booking form (customer role)
// Any authenticated user can read; no PII here.
router.get('/', authenticateToken, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      include: {
        zones: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    success(res, cities);
  } catch (err) {
    next(err);
  }
});

export default router;
