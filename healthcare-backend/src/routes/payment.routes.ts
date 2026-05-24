import { Router } from 'express';
import { paymentController } from '../controller/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly, customerOnly } from '../middleware/role.middleware';

const router = Router();

router.get('/booking/:bookingId', authenticateToken, paymentController.getByBooking);
router.patch('/booking/:bookingId/mark-paid', authenticateToken, adminOnly, paymentController.markCashPaid);
router.post('/create-intent', authenticateToken, customerOnly, paymentController.createIntent);

export default router;
