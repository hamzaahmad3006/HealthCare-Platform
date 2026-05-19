import './config/env'; // validate env vars on startup
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { auditLogMiddleware } from './middleware/auditLog.middleware';
import { globalErrorHandler } from './middleware/error.middleware';
import { paymentController } from './controller/payment.controller';
import apiRoutes from './routes/index';

const app = express();

// ── Stripe webhook — MUST be before express.json() ───────────────────────────
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook,
);

// ── Request ID ────────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string | undefined) ?? uuidv4();
  req.id = id;
  res.locals['requestId'] = id;
  res.setHeader('X-Request-ID', id);
  next();
});

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Offline-Sync-Id', 'X-Request-ID'],
}));

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// ── Application middleware ────────────────────────────────────────────────────
app.use('/api/v1', apiLimiter);
app.use('/api/v1', auditLogMiddleware);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── Global error handler — must be last ──────────────────────────────────────
app.use(globalErrorHandler);

// ── Server start ──────────────────────────────────────────────────────────────
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Healthcare API running on port ${PORT} [${env.NODE_ENV}]`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info('HTTP server closed');

    await prisma.$disconnect();
    logger.info('Database disconnected');

    await redis.quit();
    logger.info('Redis disconnected');

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(() => process.exit(1)); });
process.on('SIGINT', () => { shutdown('SIGINT').catch(() => process.exit(1)); });

export default app;
