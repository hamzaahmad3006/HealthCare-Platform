import { Router } from 'express';
import { bookingController } from '../controller/booking.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';
import { idempotencyMiddleware } from '../middleware/idempotency.middleware';

const router = Router();

router.post('/', authenticateToken, idempotencyMiddleware, bookingController.create);
router.get('/', authenticateToken, bookingController.list);
router.get('/:id', authenticateToken, bookingController.getById);
router.patch('/:id/confirm', authenticateToken, adminOnly, bookingController.confirm);
router.patch('/:id/cancel', authenticateToken, bookingController.cancel);
router.patch('/:id/reschedule', authenticateToken, adminOnly, bookingController.reschedule);
router.post('/:id/assignments', authenticateToken, adminOnly, bookingController.assignStaff);
router.get('/:id/visits', authenticateToken, bookingController.getVisits);

export default router;
