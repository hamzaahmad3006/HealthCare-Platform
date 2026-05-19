import { Router } from 'express';
import { userController } from '../controller/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOrCustomer, adminOnly, customerOnly } from '../middleware/role.middleware';

const router = Router();

router.get('/me', authenticateToken, userController.getMe);
router.patch('/me', authenticateToken, userController.updateMe);

router.post('/patients', authenticateToken, customerOnly, userController.createPatient);
router.get('/patients', authenticateToken, userController.getPatients);
router.get('/patients/:id', authenticateToken, userController.getPatientById);
router.patch('/patients/:id', authenticateToken, userController.updatePatient);

router.post('/addresses', authenticateToken, customerOnly, userController.createAddress);
router.get('/addresses', authenticateToken, userController.getAddresses);
router.patch('/addresses/:id', authenticateToken, adminOrCustomer, userController.updateAddress);
router.delete('/addresses/:id', authenticateToken, adminOrCustomer, userController.deleteAddress);

export default router;
