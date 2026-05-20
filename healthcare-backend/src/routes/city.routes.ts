import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

const router = Router();

// Cities + nested zones — read-only reference data used by admin Add Staff form
// and customer-facing forms. Cached at the DB level (small table).
router.get('/', authenticateToken, adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
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
