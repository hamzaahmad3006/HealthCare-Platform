import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { assertBookingAccess } from '../helper/bookingAccess.helper';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { success } from '../helper/response.helper';
import { BusinessError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/stateMachine';
import { logger } from '../utils/logger';
import { STRIPE_EVENT_DEDUP_TTL } from '../utils/constants';
import { pickParam } from '../helper/request.helper';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export const paymentController = {
  // ── Cash on Visit ──────────────────────────────────────────────────────────

  async getByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      const bookingId = pickParam(req, 'bookingId');
      await assertBookingAccess(req.user, bookingId, false);
      const payment = await prisma.payment.findFirst({ where: { bookingId } });
      success(res, payment);
    } catch (err) { next(err); }
  },

  async markCashPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');
      if (req.user.role !== 'ADMIN') throw new ForbiddenError('FORBIDDEN');
      const bookingId = pickParam(req, 'bookingId');
      const payment = await prisma.payment.findFirst({ where: { bookingId } });
      if (!payment) throw new NotFoundError('PAYMENT_NOT_FOUND');
      if (payment.paymentMethod !== 'CASH') {
        throw new BusinessError('NOT_CASH_PAYMENT', 'Only cash payments can be manually marked paid');
      }
      // Compare-and-set preserves the original collector and receipt timestamp on retries.
      if (payment.status === 'PAID') { success(res, payment); return; }
      if (payment.status !== 'PENDING') throw new BusinessError('INVALID_PAYMENT_STATE');
      const changed = await prisma.payment.updateMany({
        where: { id: payment.id, paymentMethod: 'CASH', status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date(), collectedByUserId: req.user.sub },
      });
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      if (!changed.count && updated?.status !== 'PAID') throw new BusinessError('PAYMENT_STATE_CHANGED');
      success(res, updated);
    } catch (err) { next(err); }
  },

  // ── Stripe ─────────────────────────────────────────────────────────────────

  async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      if (req.user.role !== 'CUSTOMER') throw new ForbiddenError('FORBIDDEN');
      const { bookingId } = z.object({ bookingId: z.string().uuid() }).parse(req.body);
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking || booking.customerUserId !== req.user.sub) {
        throw new NotFoundError('BOOKING_NOT_FOUND');
      }
      if (booking.status !== 'CONFIRMED') {
        throw new BusinessError('BOOKING_MUST_BE_CONFIRMED', 'Booking must be confirmed before payment');
      }

      // Cash collection and online charging must not coexist for the same invoice.
      // Switching payment methods requires an explicit reconciliation workflow.
      const payments = await prisma.payment.findMany({ where: { bookingId } });
      if (payments.some(p => p.status === 'PAID' || p.status === 'REFUNDED')) {
        throw new BusinessError('PAYMENT_ALREADY_SETTLED');
      }
      if (payments.some(p => p.paymentMethod !== 'STRIPE')) {
        throw new BusinessError('PAYMENT_METHOD_CONFLICT', 'This booking already uses another payment method');
      }
      const idempotencyKey = `pi-${bookingId}`;

      const existing = await prisma.payment.findUnique({
        where: { stripeIdempotencyKey: idempotencyKey },
      });

      if (existing?.stripePaymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(existing.stripePaymentIntentId);
        success(res, { clientSecret: pi.client_secret });
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(Number(booking.totalPrice) * 100),
          currency: booking.currency.toLowerCase(),
          metadata: {
            bookingId,
            bookingNumber: booking.bookingNumber,
            customerId: req.user.sub,
          },
          description: `Healthcare booking ${booking.bookingNumber}`,
        },
        { idempotencyKey },
      );

      await prisma.payment.upsert({
        where: { stripeIdempotencyKey: idempotencyKey },
        update: {},
        create: {
          paymentMethod: 'STRIPE',
          bookingId,
          stripePaymentIntentId: paymentIntent.id,
          stripeIdempotencyKey: idempotencyKey,
          amount: booking.totalPrice,
          currency: booking.currency,
          status: 'PENDING',
        },
      });

      success(res, { clientSecret: paymentIntent.client_secret });
    } catch (err) { next(err); }
  },

  async stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('Stripe webhook signature verification failed', { error: message });
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    const dedupKey = `stripe_event:${event.id}`;
    try {
      const processed = await redis.get(dedupKey);
      if (processed) {
        res.status(200).json({ received: true, duplicate: true });
        return;
      }
      await processStripeEvent(event);
      await redis.set(dedupKey, '1', 'EX', STRIPE_EVENT_DEDUP_TTL);
      res.status(200).json({ received: true });
    } catch (err) {
      logger.error('Stripe event processing failed', { eventId: event.id, err });
      next(err);
    }
  },
};

async function processStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }
}

// Payment callbacks settle the stored invoice; booking lifecycle and confirmation
// notifications belong exclusively to the booking workflow. Durable predicates
// remain safe when Redis expires or two webhook deliveries run concurrently.
async function handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: pi.id } });
  if (!payment) throw new NotFoundError('PAYMENT_NOT_FOUND');
  if (payment.paymentMethod !== 'STRIPE' || payment.bookingId !== pi.metadata['bookingId'] ||
      Math.round(Number(payment.amount) * 100) !== pi.amount_received ||
      payment.currency.toLowerCase() !== pi.currency.toLowerCase()) {
    throw new BusinessError('PAYMENT_DETAILS_MISMATCH');
  }
  await prisma.payment.updateMany({
    where: { id: payment.id, status: { in: ['PENDING', 'FAILED'] } },
    data: { status: 'PAID', paidAt: new Date() },
  });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: pi.id, paymentMethod: 'STRIPE', status: 'PENDING' },
    data: { status: 'FAILED' },
  });
}
