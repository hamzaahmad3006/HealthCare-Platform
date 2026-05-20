import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { success } from '../helper/response.helper';

const router = Router();

const ListQuerySchema = z.object({
  serviceTypeId: z.string().uuid().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

// Packages — public reference data, mirrors the service-types route. The
// booking form queries `?serviceTypeId=...&isActive=true` to populate Step 1.
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serviceTypeId, isActive } = ListQuerySchema.parse(req.query);
    const packages = await prisma.package.findMany({
      where: {
        ...(serviceTypeId && { serviceTypeId }),
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: [{ packageType: 'asc' }, { priceAmount: 'asc' }],
    });
    success(res, packages);
  } catch (err) {
    next(err);
  }
});

export default router;
