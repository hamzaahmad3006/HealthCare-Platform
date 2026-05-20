import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';

const router = Router();

// Service types — public reference data. Landing page shows these without
// requiring login (so the marketing copy + booking form work for anonymous
// visitors). Admin and staff also call this from authenticated screens, but
// no auth middleware is needed since the data is non-sensitive catalog.
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await prisma.serviceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    success(res, services);
  } catch (err) {
    next(err);
  }
});

export default router;
