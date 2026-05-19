import { Router } from 'express';
import { adminController } from '../controller/admin.controller';
import { notificationController } from '../controller/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

const router = Router();

router.get('/dashboard/summary', authenticateToken, adminOnly, adminController.dashboardSummary);
router.get('/dashboard/staff-util', authenticateToken, adminOnly, adminController.staffUtilization);
router.get('/audit-logs', authenticateToken, adminOnly, adminController.auditLogs);
router.post('/notifications/:id/retry', authenticateToken, adminOnly, notificationController.retry);

export default router;
