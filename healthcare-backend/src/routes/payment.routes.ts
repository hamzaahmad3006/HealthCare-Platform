import { Router } from 'express';
import { paymentController } from '../controller/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { customerOnly } from '../middleware/role.middleware';

const router = Router();

router.post('/create-intent', authenticateToken, customerOnly, paymentController.createIntent);

export default router;
