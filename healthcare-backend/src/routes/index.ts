import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis, usingRedis } from '../config/redis';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import staffRoutes from './staff.routes';
import cityRoutes from './city.routes';
import serviceTypeRoutes from './serviceType.routes';
import packageRoutes from './package.routes';
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
// whether the instance should receive traffic. When REDIS_URL is unset the
// Redis check is skipped — the in-memory shim is always "ready".
router.get('/readyz', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'fail' | 'skipped'> = {
    db: 'fail',
    redis: usingRedis ? 'fail' : 'skipped',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks['db'] = 'ok';
  } catch {
    // db stays 'fail'
  }

  if (usingRedis) {
    try {
      const pong = await redis.ping();
      if (pong === 'PONG') checks['redis'] = 'ok';
    } catch {
      // redis stays 'fail'
    }
  }

  const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'skipped');
  res.status(allOk ? 200 : 503).json({
    success: allOk,
    data: { checks, timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/staff', staffRoutes);
router.use('/cities', cityRoutes);
router.use('/service-types', serviceTypeRoutes);
router.use('/packages', packageRoutes);
router.use('/bookings', bookingRoutes);
router.use('/visits', visitRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);

export default router;
