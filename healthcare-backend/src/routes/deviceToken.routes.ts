import { Router } from 'express';
import { deviceTokenController } from '../controller/deviceToken.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateToken, deviceTokenController.register);
router.delete('/:id', authenticateToken, deviceTokenController.unregister);

export default router;
