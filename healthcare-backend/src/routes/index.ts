import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import staffRoutes from './staff.routes';
import bookingRoutes from './booking.routes';
import visitRoutes from './visit.routes';
import reportRoutes from './report.routes';
import reviewRoutes from './review.routes';
import adminRoutes from './admin.routes';
import paymentRoutes from './payment.routes';

const router = Router();

// Liveness — minimal, never touches dependencies. Used by Kubernetes liveness
// probes; should only fail if the process itself is unhealthy.
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

// Readiness — checks downstream dependencies. Used by load balancers to decide
// whether the instance should receive traffic.
router.get('/readyz', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'fail'> = { db: 'fail', redis: 'fail' };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks['db'] = 'ok';
  } catch {
    // db stays 'fail'
  }

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') checks['redis'] = 'ok';
  } catch {
    // redis stays 'fail'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    success: allOk,
    data: { checks, timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/staff', staffRoutes);
router.use('/bookings', bookingRoutes);
router.use('/visits', visitRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);

export default router;
