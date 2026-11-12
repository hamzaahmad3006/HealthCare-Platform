import { Router } from 'express';
import { visitController } from '../controller/visit.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly, adminOrStaff } from '../middleware/role.middleware';

import { verifiedStaff } from '../middleware/verifiedStaff.middleware';

const router = Router();

router.get('/', authenticateToken, adminOrStaff, visitController.list);
router.get('/:id', authenticateToken, visitController.getById);
router.patch('/:id/en-route', authenticateToken, adminOrStaff, verifiedStaff, visitController.enRoute);
router.patch('/:id/check-in', authenticateToken, adminOrStaff, verifiedStaff, visitController.checkIn);
router.patch('/:id/check-out', authenticateToken, adminOrStaff, verifiedStaff, visitController.checkOut);
router.patch('/:id/complete', authenticateToken, adminOrStaff, verifiedStaff, visitController.complete);
router.patch('/:id/miss', authenticateToken, adminOnly, visitController.miss);
router.patch('/:id/cancel', authenticateToken, adminOnly, visitController.cancelVisit);

export default router;
