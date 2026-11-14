import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AppError } from '../../src/utils/stateMachine';

// Provider side effects are always mocked, but database queries and transactions
// use real PostgreSQL and the actual Prisma client.
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn().mockResolvedValue(null) } }));
import { prisma } from '../../src/config/database';
import { bookingController } from '../../src/controller/booking.controller';
import { idempotencyMiddleware } from '../../src/middleware/idempotency.middleware';
import { notificationQueue } from '../../worker/notification.worker';

const app = express();
app.use(express.json());
app.post('/bookings', (req, _res, next) => {
  req.user = { sub: req.header('x-test-user')!, role: 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 };
  next();
}, idempotencyMiddleware, bookingController.create);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.statusCode ?? 500).json({ error: { code: err.code ?? 'INTERNAL' } });
});

async function fixture() {
  const unique = randomUUID();
  return prisma.$transaction(async tx => {
    const city = await tx.city.create({ data: { name: 'Test City', slug: unique } });
    const user = await tx.user.create({ data: { role: 'CUSTOMER', fullName: 'Synthetic Test User', phone: unique.slice(0, 20), passwordHash: 'test-unused' } });
    const service = await tx.serviceType.create({ data: { name: 'Test Service', code: unique } });
    const pkg = await tx.package.create({ data: { name: 'Test Package', serviceTypeId: service.id, cityId: city.id, packageType: 'PER_VISIT', durationDays: 1, visitCount: 1, priceAmount: 100 } });
    const patient = await tx.patient.create({ data: { customerUserId: user.id, fullName: 'Synthetic Test Patient' } });
    const address = await tx.address.create({ data: { customerUserId: user.id, cityId: city.id, contactName: 'Test', contactPhone: '+10000000000', line1: 'Test street', area: 'Test' } });
    return { city, user, service, pkg, patient, address };
  });
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
const fixtures: Fixture[] = [];
const payload = (f: Fixture) => ({ patientId: f.patient.id, addressId: f.address.id, cityId: f.city.id, serviceTypeId: f.service.id, packageId: f.pkg.id, requestedStartAt: '2035-01-01T12:00:00.000Z', source: 'WEB' });
const send = (f: Fixture, key: string, body = payload(f)) => request(app).post('/bookings').set('x-test-user', f.user.id).set('X-Idempotency-Key', key).send(body);

beforeAll(async () => { fixtures.push(await fixture(), await fixture()); });
afterAll(async () => {
  for (const f of fixtures) {
    const bookings = { customerUserId: f.user.id };
    await prisma.$transaction(async tx => {
      await tx.notificationLog.deleteMany({ where: { booking: bookings } });
      await tx.bookingVisit.deleteMany({ where: { booking: bookings } });
      await tx.bookingCreationRequest.deleteMany({ where: { booking: bookings } });
      await tx.booking.deleteMany({ where: bookings });
      await tx.patient.deleteMany({ where: { customerUserId: f.user.id } });
      await tx.address.deleteMany({ where: { customerUserId: f.user.id } });
      await tx.user.delete({ where: { id: f.user.id } });
      await tx.package.delete({ where: { id: f.pkg.id } });
      await tx.serviceType.delete({ where: { id: f.service.id } });
      await tx.city.delete({ where: { id: f.city.id } });
    });
  }
  await prisma.$disconnect();
});

it('commits exactly one booking, visit, request record and notification under concurrent submission', async () => {
  const f = fixtures[0]!;
  const key = randomUUID();
  const results = await Promise.all(Array.from({ length: 6 }, () => send(f, key)));
  expect(results.filter(result => result.status === 201)).toHaveLength(1);
  expect(results.every(result => [200, 201, 409].includes(result.status))).toBe(true);
  const winner = results.find(result => result.status === 201)!;
  const replay = await send(f, key);
  expect(replay.status).toBe(200);
  expect(replay.body.data.id).toBe(winner.body.data.id);
  expect(await prisma.booking.count({ where: { customerUserId: f.user.id } })).toBe(1);
  expect(await prisma.bookingVisit.count({ where: { bookingId: winner.body.data.id } })).toBe(1);
  expect(await prisma.notificationLog.count({ where: { bookingId: winner.body.data.id } })).toBe(1);
  expect(await prisma.bookingCreationRequest.count({ where: { bookingId: winner.body.data.id } })).toBe(1);
  expect(notificationQueue.add).toHaveBeenCalledTimes(1);
  const changed = await send(f, key, { ...payload(f), requestedStartAt: '2035-01-02T12:00:00.000Z' });
  expect(changed.status).toBe(409);
  expect(changed.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  // Same raw key used by another customer is an independent operation.
  const other = await send(fixtures[1]!, key);
  expect(other.status).toBe(201);
  expect(other.body.data.customerUserId).toBe(fixtures[1]!.user.id);
  expect(other.body.data.id).not.toBe(winner.body.data.id);
});
