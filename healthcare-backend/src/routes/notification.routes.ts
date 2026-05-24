import { Router } from 'express';
import { notificationController } from '../controller/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

const router = Router();

router.get('/', authenticateToken, notificationController.list);
router.post('/:id/retry', authenticateToken, adminOnly, notificationController.retry);

export default router;
