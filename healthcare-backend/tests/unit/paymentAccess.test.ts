import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

jest.mock('../../src/config/env', () => ({ env: { STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'test' } }));
jest.mock('../../src/config/database', () => ({ prisma: {
  booking: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  payment: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), updateMany: jest.fn(), upsert: jest.fn() },
  notificationLog: { create: jest.fn() },
} }));
jest.mock('../../src/config/redis', () => ({ redis: { get: jest.fn(), set: jest.fn() } }));
jest.mock('stripe', () => jest.fn().mockImplementation(() => ({
  webhooks: { constructEvent: (...args: unknown[]) => mockConstruct(...args) },
  paymentIntents: { create: (...args: unknown[]) => mockCreate(...args), retrieve: (...args: unknown[]) => mockRetrieve(...args) },
})));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = { sub: req.header('x-user') ?? 'customer', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 };
    next();
  },
}));
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';
import routes from '../../src/routes/payment.routes';
import { paymentController } from '../../src/controller/payment.controller';
import { globalErrorHandler } from '../../src/middleware/error.middleware';
const mockConstruct = jest.fn();
const mockCreate = jest.fn();
const mockRetrieve = jest.fn();
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const bookingId = '00000000-0000-4000-8000-000000000001';
let payment: { id: string; bookingId: string; paymentMethod: string; status: string; amount: number; currency: string; stripePaymentIntentId: string; paidAt?: Date; collectedByUserId?: string };
const app = express();
app.use(express.json());
app.use('/payments', routes);
app.post('/webhook', paymentController.stripeWebhook);
app.use(globalErrorHandler);

beforeEach(() => {
  jest.resetAllMocks();
  payment = { id: 'payment', bookingId, paymentMethod: 'STRIPE', status: 'PENDING', amount: 100, currency: 'PKR', stripePaymentIntentId: 'pi_test' };
  db.booking.findUnique.mockResolvedValue({ id: bookingId, customerUserId: 'customer', status: 'CONFIRMED', totalPrice: 100, currency: 'PKR', bookingNumber: 'TEST' });
  db.booking.findFirst.mockImplementation(async ({ where }) => {
    const scope = where.AND[0];
    return !Object.keys(scope).length || scope.customerUserId === 'customer' || scope.OR?.[0]?.visits?.some?.assignedStaffUserId === 'assigned' ? { id: bookingId } : null;
  });
  db.payment.findFirst.mockImplementation(async () => ({ ...payment }));
  db.payment.findUnique.mockImplementation(async () => ({ ...payment }));
  db.payment.findMany.mockResolvedValue([]);
  db.payment.updateMany.mockImplementation(async ({ where, data }) => {
    const matches = typeof where.status === 'string' ? payment.status === where.status : where.status.in.includes(payment.status);
    if (!matches) return { count: 0 };
    Object.assign(payment, data);
    return { count: 1 };
  });
  mockCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'test_secret' });
  mockRetrieve.mockResolvedValue({ client_secret: 'test_secret' });
});

it.each([['ADMIN', 'admin', 200], ['CUSTOMER', 'customer', 200], ['CUSTOMER', 'other', 403], ['STAFF', 'assigned', 200], ['STAFF', 'unrelated', 403], ['STAFF', 'preferred-only', 403]])('payment read enforces %s / %s access', async (role, user, status) => {
  await request(app).get(`/payments/booking/${bookingId}`).set('x-role', role).set('x-user', user).expect(status);
  if (status === 403) expect(db.payment.findFirst).not.toHaveBeenCalled();
});
it.each(['CUSTOMER', 'STAFF'])('rejects manual collection by %s', async role => {
  await request(app).patch(`/payments/booking/${bookingId}/mark-paid`).set('x-role', role).expect(403);
  expect(db.payment.updateMany).not.toHaveBeenCalled();
});
it('records cash once and preserves original collector and paid timestamp on retries', async () => {
  payment.paymentMethod = 'CASH';
  await request(app).patch(`/payments/booking/${bookingId}/mark-paid`).set('x-role', 'ADMIN').set('x-user', 'first').expect(200);
  const paidAt = payment.paidAt;
  await request(app).patch(`/payments/booking/${bookingId}/mark-paid`).set('x-role', 'ADMIN').set('x-user', 'second').expect(200);
  expect(payment.collectedByUserId).toBe('first');
  expect(payment.paidAt).toBe(paidAt);
  expect(db.payment.updateMany).toHaveBeenCalledTimes(1);
});
it.each(['REFUNDED', 'FAILED'])('does not collect %s cash invoices', async status => {
  payment.paymentMethod = 'CASH'; payment.status = status;
  const response = await request(app).patch(`/payments/booking/${bookingId}/mark-paid`).set('x-role', 'ADMIN');
  expect(response.body.error.code).toBe('INVALID_PAYMENT_STATE');
  expect(db.payment.updateMany).not.toHaveBeenCalled();
});
it('validates intent payload before database access', async () => {
  await request(app).post('/payments/create-intent').send({ bookingId: 'bad' }).expect(400);
  expect(db.booking.findUnique).not.toHaveBeenCalled();
});
it('rejects another customer and invalid booking state', async () => {
  await request(app).post('/payments/create-intent').set('x-user', 'other').send({ bookingId }).expect(404);
  db.booking.findUnique.mockResolvedValue({ customerUserId: 'customer', status: 'CANCELLED' });
  const response = await request(app).post('/payments/create-intent').send({ bookingId });
  expect(response.body.error.code).toBe('BOOKING_MUST_BE_CONFIRMED');
  expect(mockCreate).not.toHaveBeenCalled();
});
it.each([['CASH', 'PENDING', 'PAYMENT_METHOD_CONFLICT'], ['STRIPE', 'PAID', 'PAYMENT_ALREADY_SETTLED'], ['STRIPE', 'REFUNDED', 'PAYMENT_ALREADY_SETTLED']])('does not charge a %s / %s invoice', async (paymentMethod, status, code) => {
  db.payment.findMany.mockResolvedValue([{ paymentMethod, status }]);
  const response = await request(app).post('/payments/create-intent').send({ bookingId });
  expect(response.body.error.code).toBe(code);
  expect(mockCreate).not.toHaveBeenCalled();
});
it('uses Stripe method and stable idempotency for a new intent', async () => {
  db.payment.findUnique.mockResolvedValue(null);
  await request(app).post('/payments/create-intent').send({ bookingId }).expect(200);
  expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 10000, currency: 'pkr' }), { idempotencyKey: `pi-${bookingId}` });
  expect(db.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ paymentMethod: 'STRIPE', bookingId }) }));
});
function event(type = 'payment_intent.succeeded', overrides = {}) {
  mockConstruct.mockReturnValue({ id: 'evt_test', type, data: { object: { id: 'pi_test', metadata: { bookingId }, amount_received: 10000, currency: 'pkr', ...overrides } } });
  return request(app).post('/webhook').set('stripe-signature', 'test').send({});
}
it('settles once without reopening a booking or sending a second confirmation', async () => {
  await event().expect(200);
  const paidAt = payment.paidAt;
  await event().expect(200); // no Redis dedup: durable payment predicate is authoritative
  expect(payment.status).toBe('PAID');
  expect(payment.paidAt).toBe(paidAt);
  expect(db.booking.update).not.toHaveBeenCalled();
  expect(db.notificationLog.create).not.toHaveBeenCalled();
});
it.each(['PAID', 'REFUNDED'])('stale failure cannot downgrade %s', async status => {
  payment.status = status;
  await event('payment_intent.payment_failed').expect(200);
  expect(payment.status).toBe(status);
});
it('allows a failed attempt to succeed but never revives a refund', async () => {
  payment.status = 'FAILED'; await event().expect(200); expect(payment.status).toBe('PAID');
  payment.status = 'REFUNDED'; await event().expect(200); expect(payment.status).toBe('REFUNDED');
});
it.each([{ metadata: { bookingId: 'other' } }, { amount_received: 1 }, { currency: 'usd' }])('rejects a mismatched settlement %j', async overrides => {
  const response = await event('payment_intent.succeeded', overrides);
  expect(response.body.error.code).toBe('PAYMENT_DETAILS_MISMATCH');
  expect(db.payment.updateMany).not.toHaveBeenCalled();
  expect(redis.set).not.toHaveBeenCalled();
});
it('rejects invalid signatures without any database writes', async () => {
  mockConstruct.mockImplementation(() => { throw new Error('Invalid signature'); });
  await request(app).post('/webhook').send({}).expect(400);
  expect(db.payment.updateMany).not.toHaveBeenCalled();
});
