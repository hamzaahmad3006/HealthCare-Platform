import { Router } from 'express';
import { reportController } from '../controller/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly, adminOrStaff } from '../middleware/role.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', authenticateToken, adminOrStaff, reportController.create);
router.get('/', authenticateToken, reportController.list);
router.get('/:id', authenticateToken, reportController.getById);
router.patch('/:id', authenticateToken, adminOrStaff, reportController.update);
router.post('/:id/files/presign', authenticateToken, adminOrStaff, uploadLimiter, reportController.presignFile);
router.post('/:id/files/confirm', authenticateToken, adminOrStaff, reportController.confirmFile);
router.delete('/:id/files/:fileId', authenticateToken, adminOnly, reportController.deleteFile);

export default router;
