import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../../src/utils/stateMachine';

jest.mock('../../src/config/database', () => ({ prisma: {
  bookingCreationRequest: { findUnique: jest.fn(), deleteMany: jest.fn(), create: jest.fn() },
  patient: { findUnique: jest.fn() }, address: { findUnique: jest.fn() },
  package: { findUniqueOrThrow: jest.fn() }, city: { findUnique: jest.fn() },
  serviceType: { findUnique: jest.fn() }, booking: { create: jest.fn() },
  bookingVisit: { createMany: jest.fn() }, notificationLog: { create: jest.fn() },
  $queryRaw: jest.fn(), $transaction: jest.fn(),
} }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
import { prisma } from '../../src/config/database';
import { bookingController } from '../../src/controller/booking.controller';
import { idempotencyMiddleware } from '../../src/middleware/idempotency.middleware';
import { notificationQueue } from '../../worker/notification.worker';

const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const id = '00000000-0000-4000-8000-000000000001';
const payload = { patientId: id, addressId: id, serviceTypeId: id, cityId: id, packageId: id, requestedStartAt: '2035-01-01T12:00:00.000Z' };
type Row = Record<string, unknown>;
const records = new Map<string, Row>();
let created: Row[] = [];
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.user = { sub: req.header('x-user') ?? 'alice', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 };
  next();
});
app.post('/bookings', idempotencyMiddleware, bookingController.create);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err instanceof ZodError ? 400 : err.statusCode ?? 500).json({ error: { code: err.code } });
});
const send = (body: Row = payload, actor = 'alice', key = 'same-key') => request(app).post('/bookings').set('x-user', actor).set('X-Idempotency-Key', key).send(body);

beforeEach(() => {
  jest.resetAllMocks(); records.clear(); created = [];
  db.patient.findUnique.mockResolvedValue({ customerUserId: 'alice' });
  db.address.findUnique.mockResolvedValue({ customerUserId: 'alice', cityId: id, contactPhone: '+10000000000' });
  db.package.findUniqueOrThrow.mockResolvedValue({ isActive: true, serviceTypeId: id, priceAmount: 100, currency: 'PKR', name: 'Test', packageType: 'PER_VISIT', durationDays: 1, visitCount: 1 });
  db.city.findUnique.mockResolvedValue({ slug: 'test' });
  db.serviceType.findUnique.mockResolvedValue({ code: 'NURSING' });
  (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 0n }]);
  db.booking.create.mockImplementation(async ({ data }: { data: Row }) => {
    const row = { id: `booking-${created.length + 1}`, ...data }; created.push(row); return row;
  });
  db.notificationLog.create.mockResolvedValue({ id: 'notification' });
  (notificationQueue.add as jest.Mock).mockResolvedValue(null);
  db.bookingCreationRequest.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    const record = records.get(where.id);
    return record ? { ...record, booking: created.find(row => row.id === record.bookingId) } : null;
  });
  db.bookingCreationRequest.deleteMany.mockImplementation(async ({ where }: { where: { id: string; expiresAt: { lte: Date } } }) => {
    if ((records.get(where.id)?.expiresAt as Date) <= where.expiresAt.lte) records.delete(where.id);
    return { count: 0 };
  });
  db.bookingCreationRequest.create.mockImplementation(async ({ data }: { data: Row & { id: string } }) => {
    if (records.has(data.id)) throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: '5' });
    records.set(data.id, data); return data;
  });
  (prisma.$transaction as jest.Mock).mockImplementation(async (work: (tx: typeof prisma) => Promise<unknown>) => {
    const snapshot = [...created];
    try { return await work(prisma); } catch (err) { created = snapshot; throw err; }
  });
});

it.each(['WEB', 'MOBILE'])('replays %s requests with one booking, visit generation and notification', async source => {
  const first = await send({ ...payload, source });
  const replay = await send(Object.fromEntries(Object.entries({ ...payload, source }).reverse()));
  expect(first.status).toBe(201); expect(replay.status).toBe(200);
  expect(replay.body.data.id).toBe(first.body.data.id);
  expect(db.booking.create).toHaveBeenCalledTimes(1);
  expect(db.bookingVisit.createMany).toHaveBeenCalledTimes(1);
  expect(notificationQueue.add).toHaveBeenCalledTimes(1);
});
it('does not replay another customer response when raw keys match', async () => {
  await send();
  const result = await send(payload, 'bob');
  expect(result.status).toBe(403); expect(result.body.data).toBeUndefined();
  db.patient.findUnique.mockResolvedValue({ customerUserId: 'bob' });
  db.address.findUnique.mockResolvedValue({ customerUserId: 'bob', cityId: id });
  const own = await send(payload, 'bob');
  expect(own.status).toBe(201); expect(own.body.data.customerUserId).toBe('bob');
  expect(records.size).toBe(2);
});
it('still denies staff even when a customer already used the same key', async () => {
  await send();
  const result = await send().set('x-role', 'STAFF');
  expect(result.status).toBe(403); expect(db.booking.create).toHaveBeenCalledTimes(1);
});
it('rejects reusing a committed key for different content', async () => {
  await send();
  const result = await send({ ...payload, urgencyLevel: 'URGENT' });
  expect(result.status).toBe(409); expect(result.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  expect(db.booking.create).toHaveBeenCalledTimes(1);
});
it('does not reserve a key on validation failure', async () => {
  expect((await send({ ...payload, patientId: 'invalid' })).status).toBe(400);
  expect(records.size).toBe(0); expect((await send()).status).toBe(201);
});
it.each(['', 'a'.repeat(129), 'bad:key'])('rejects malformed key %s before any database operation', async key => {
  expect((await send(payload, 'alice', key)).status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it('preserves clients without a key', async () => {
  const result = await request(app).post('/bookings').send(payload);
  expect(result.status).toBe(201); expect(records.size).toBe(0);
});
it('rolls back booking creation if request record persistence fails', async () => {
  db.bookingCreationRequest.create.mockRejectedValueOnce(new Error('storage failed'));
  expect((await send()).status).toBe(500);
  expect(created).toEqual([]); expect(notificationQueue.add).not.toHaveBeenCalled();
  expect((await send()).status).toBe(201);
});
it('allows key reuse only after the 24-hour record expires', async () => {
  await send();
  for (const record of records.values()) record.expiresAt = new Date(0);
  expect((await send({ ...payload, urgencyLevel: 'URGENT' })).status).toBe(201);
  expect(created).toHaveLength(2);
});
it('returns a retryable conflict when a serialization collision has no committed replay yet', async () => {
  (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Conflict', { code: 'P2034', clientVersion: '5' }));
  const result = await send();
  expect(result.status).toBe(409); expect(result.body.error.code).toBe('BOOKING_RETRY');
  expect(result.headers['retry-after']).toBe('1');
  expect(notificationQueue.add).not.toHaveBeenCalled();
  expect((await send()).status).toBe(201);
});
it('fails closed when the durable request store is unavailable', async () => {
  db.bookingCreationRequest.findUnique.mockRejectedValueOnce(new Error('unavailable'));
  expect((await send()).status).toBe(500);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
it.each(['P2002', 'P2034'])('replays the winner after a concurrent %s and does not enqueue again', async code => {
  (prisma.$transaction as jest.Mock).mockImplementationOnce(async (work: (tx: typeof prisma) => Promise<unknown>) => {
    await work(prisma); // model the other transaction having committed before this loses
    throw new Prisma.PrismaClientKnownRequestError('Conflict', { code, clientVersion: '5' });
  });
  const result = await send();
  expect(result.status).toBe(200); expect(result.body.data.id).toBe('booking-1');
  expect(notificationQueue.add).not.toHaveBeenCalled();
});
