import { Router } from 'express';
import { staffController } from '../controller/staff.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly, adminOrStaff } from '../middleware/role.middleware';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', authenticateToken, adminOnly, staffController.create);
router.get('/', authenticateToken, adminOnly, staffController.list);

// "/me" must come before "/:userId" so it isn't swallowed by the param.
router.get('/me', authenticateToken, staffController.getMyProfile);
router.patch('/me/profile', authenticateToken, staffController.completeMyProfile);

router.get('/:userId', authenticateToken, adminOrStaff, staffController.getById);
router.patch('/:userId', authenticateToken, adminOnly, staffController.update);
router.post('/:userId/verify', authenticateToken, adminOnly, staffController.verify);
router.patch('/:userId/availability', authenticateToken, adminOrStaff, staffController.toggleAvailability);

router.post('/:userId/services', authenticateToken, adminOnly, staffController.addServiceType);
router.delete('/:userId/services/:svcTypeId', authenticateToken, adminOnly, staffController.removeServiceType);

router.post('/:userId/documents/presign', authenticateToken, adminOrStaff, uploadLimiter, staffController.presignDocument);
router.post('/:userId/documents/confirm', authenticateToken, adminOrStaff, staffController.confirmDocument);
router.get('/:userId/documents', authenticateToken, adminOnly, staffController.getDocuments);

export default router;
