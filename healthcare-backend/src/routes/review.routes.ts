import { Router } from 'express';
import { reviewController } from '../controller/review.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly, customerOnly } from '../middleware/role.middleware';

const router = Router();

router.post('/', authenticateToken, customerOnly, reviewController.create);
router.get('/', authenticateToken, adminOnly, reviewController.list);

export default router;
