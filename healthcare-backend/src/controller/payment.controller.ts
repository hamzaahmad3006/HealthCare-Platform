import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { success } from '../helper/response.helper';
import { BusinessError, NotFoundError, UnauthorizedError } from '../utils/stateMachine';
import { logger } from '../utils/logger';
import { STRIPE_EVENT_DEDUP_TTL } from '../utils/constants';
import { notificationQueue } from '../../worker/notification.worker';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export const paymentController = {
  async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { bookingId } = req.body as { bookingId: string };
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

      if (!booking || booking.customerUserId !== req.user.sub) {
        throw new NotFoundError('BOOKING_NOT_FOUND');
      }
      if (booking.status !== 'CONFIRMED') {
        throw new BusinessError('BOOKING_MUST_BE_CONFIRMED', 'Booking must be confirmed before payment');
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

      await prisma.payment.create({
        data: {
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
    const processed = await redis.get(dedupKey);
    if (processed) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    try {
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

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const bookingId = pi.metadata['bookingId'];
  if (!bookingId) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { stripePaymentIntentId: pi.id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
  });

  await notificationQueue.add('send', { bookingId, templateCode: 'BOOKING_CONFIRMED' }).catch(() => null);
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  await prisma.payment.update({
    where: { stripePaymentIntentId: pi.id },
    data: { status: 'FAILED' },
  });
}
