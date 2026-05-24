import { Router } from 'express';
import { adminController } from '../controller/admin.controller';
import { notificationController } from '../controller/notification.controller';
import { settingsController } from '../controller/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

const router = Router();

router.get('/dashboard/summary', authenticateToken, adminOnly, adminController.dashboardSummary);
router.get('/dashboard/analytics', authenticateToken, adminOnly, adminController.analytics);
router.get('/customers', authenticateToken, adminOnly, adminController.listCustomers);
router.get('/customers/:id', authenticateToken, adminOnly, adminController.getCustomerById);
router.get('/payments', authenticateToken, adminOnly, adminController.listPayments);
router.get('/dashboard/staff-util', authenticateToken, adminOnly, adminController.staffUtilization);
router.get('/audit-logs', authenticateToken, adminOnly, adminController.auditLogs);
router.get('/notifications', authenticateToken, adminOnly, adminController.listNotifications);
router.post('/notifications/:id/retry', authenticateToken, adminOnly, notificationController.retry);

// ── Settings: Service Types ───────────────────────────────────────────────────
router.get('/settings/service-types', authenticateToken, adminOnly, settingsController.listServiceTypes);
router.post('/settings/service-types', authenticateToken, adminOnly, settingsController.createServiceType);
router.patch('/settings/service-types/:id', authenticateToken, adminOnly, settingsController.updateServiceType);

// ── Settings: Packages ────────────────────────────────────────────────────────
router.get('/settings/packages', authenticateToken, adminOnly, settingsController.listPackages);
router.post('/settings/packages', authenticateToken, adminOnly, settingsController.createPackage);
router.patch('/settings/packages/:id', authenticateToken, adminOnly, settingsController.updatePackage);
router.delete('/settings/packages/:id', authenticateToken, adminOnly, settingsController.deletePackage);

// ── Settings: Cities & Zones ──────────────────────────────────────────────────
router.get('/settings/cities', authenticateToken, adminOnly, settingsController.listCities);
router.post('/settings/cities', authenticateToken, adminOnly, settingsController.createCity);
router.patch('/settings/cities/:id', authenticateToken, adminOnly, settingsController.updateCity);
router.post('/settings/cities/:cityId/zones', authenticateToken, adminOnly, settingsController.createZone);
router.patch('/settings/cities/:cityId/zones/:zoneId', authenticateToken, adminOnly, settingsController.updateZone);
router.delete('/settings/cities/:cityId/zones/:zoneId', authenticateToken, adminOnly, settingsController.deleteZone);

export default router;
