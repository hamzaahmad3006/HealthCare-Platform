import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

jest.mock('../../src/config/database', () => ({ prisma: {
  staffProfile: { findFirst: jest.fn() },
  booking: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
  bookingVisit: { findMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  bookingAssignment: { updateMany: jest.fn() },
  notificationLog: { create: jest.fn(), updateMany: jest.fn() },
  payment: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
jest.mock('../../src/middleware/auth.middleware', () => ({ authenticateToken(req: Request, _res: Response, next: NextFunction) {
  req.user = { sub: req.header('x-user') ?? 'customer', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 };
  next();
} }));
jest.mock('../../src/middleware/idempotency.middleware', () => ({ idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next() }));

import visitRoutes from '../../src/routes/visit.routes';
import routes from '../../src/routes/booking.routes';
import { prisma } from '../../src/config/database';
import { notificationQueue } from '../../worker/notification.worker';
import { canRescheduleBooking } from '../../src/helper/reschedule.helper';
import { AppError } from '../../src/utils/stateMachine';

const id = '00000000-0000-4000-8000-000000000001';
const visitId = '00000000-0000-4000-8000-000000000002';
const start = '2035-01-02T09:00:00+05:00';
const db = prisma as unknown as { [model: string]: { [method: string]: jest.Mock } };
const initial = () => ({
  booking: { id, status: 'CONFIRMED', customerUserId: 'customer', bookingNumber: 'HH-1',
    requestedStartAt: new Date('2034-01-01T04:00:00Z'), confirmedAt: new Date(), confirmedByUserId: 'admin', proposedStartAt: null,
    package: { visitCount: 2, durationDays: 2, packageType: 'MONTHLY' },
    address: { contactPhone: null }, customer: { phone: '+923001234567' }, _count: { reports: 0 },
  },
  visits: [{ id: visitId, bookingId: id, sequenceNo: 1, status: 'ASSIGNED', assignedStaffUserId: 'staff' as string | null,
    checkInAt: null as Date | null, checkOutAt: null as Date | null,
    beforeConditionText: null as string | null, afterConditionText: null as string | null, visitNotes: null as string | null,
    _count: { reports: 0, reviews: 0 }, scheduledStartAt: new Date('2034-01-01T04:00:00Z') }],
  assignments: [{ bookingId: id, bookingVisitId: visitId, staffUserId: 'staff', status: 'ASSIGNED' }],
  notifications: [] as { id: string; templateCode: string; recipient: string; status: string; templateData: Record<string, string> }[],
  payments: [{ bookingId: id }],
});
let state = initial();
let inTransaction = false;
type Row = Record<string, unknown>;
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'AND') return (value as Row[]).every(w => matches(row, w));
    if (value && typeof value === 'object' && 'in' in value) return (value.in as unknown[]).includes(row[key]);
    return row[key] === value;
  });
}
const app = express();
app.use(express.json());
app.use('/bookings', routes);
app.use('/visits', visitRoutes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => res.status(err instanceof ZodError ? 400 : err.statusCode ?? 500).json({ error: { code: err.code ?? 'VALIDATION_ERROR' } }));

beforeEach(() => {
  jest.resetAllMocks();
  db.staffProfile.findFirst.mockResolvedValue({ userId: 'staff' });
  state = initial();
  (prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => {
    const before = structuredClone(state);
    inTransaction = true;
    try { return await callback(prisma); }
    catch (err) { state = before; throw err; }
    finally { inTransaction = false; }
  });
  db.booking.findUnique.mockImplementation(async () => ({ ...state.booking, visits: state.visits }));
  db.booking.findUniqueOrThrow.mockImplementation(async () => state.booking);
  db.booking.findFirst.mockImplementation(async ({ where }: { where: Row }) => (where.AND as Row[]).every(w => matches(state.booking, w)) ? { id } : null);
  db.booking.update.mockImplementation(async ({ where, data }: { where: Row; data: Row }) => {
    if (!matches(state.booking, where)) throw new Prisma.PrismaClientKnownRequestError('Changed', { code: 'P2025', clientVersion: '5.22.0' });
    Object.assign(state.booking, data); return { ...state.booking };
  });
  db.booking.updateMany.mockImplementation(async ({ where, data }: { where: Row; data: Row }) => {
    if (!matches(state.booking, where)) return { count: 0 };
    Object.assign(state.booking, data); return { count: 1 };
  });
  db.bookingVisit.findMany.mockImplementation(async ({ where }: { where: Row }) => state.visits.filter(v => matches(v, where)));
  db.bookingVisit.updateMany.mockImplementation(async ({ where, data }: { where: Row; data: Row }) => {
    const found = state.visits.filter(v => matches(v, where)); found.forEach(v => Object.assign(v, data)); return { count: found.length };
  });
  db.bookingVisit.createMany.mockImplementation(async ({ data }: { data: Row[] }) => {
    expect(inTransaction).toBe(true);
    data.forEach((v, i) => state.visits.push({ ...initial().visits[0], ...v, id: `new-${state.visits.length}-${i}`, assignedStaffUserId: null }));
    return { count: data.length };
  });
  db.bookingAssignment.updateMany.mockImplementation(async ({ data }: { data: Row }) => { state.assignments.forEach(a => Object.assign(a, data)); return { count: 1 }; });
  db.notificationLog.create.mockImplementation(async ({ data }: { data: Row }) => {
    expect(inTransaction).toBe(true); const row = { ...data, id: `notif-${state.notifications.length}` } as typeof state.notifications[number];
    state.notifications.push(row); return row;
  });
  db.notificationLog.updateMany.mockResolvedValue({ count: 0 });
  db.payment.findFirst.mockImplementation(async () => state.payments[0] ?? null);
  db.payment.create.mockImplementation(async () => { state.payments.push({ bookingId: id }); return state.payments[0]; });
  jest.mocked(notificationQueue.add).mockImplementation(async () => { expect(inTransaction).toBe(false); return null; });
});

it.each([['CUSTOMER', 'CONFIRMED'], ['ADMIN', 'CONFIRMED'], ['CUSTOMER', 'ASSIGNED'], ['ADMIN', 'ASSIGNED']])('reschedules safely for %s in %s without duplicate active visits', async (role, status) => {
  state.booking.status = status;
  const res = await request(app).patch(`/bookings/${id}/reschedule`).set('x-role', role).set('x-user', role === 'ADMIN' ? 'admin' : 'customer').send({ requestedStartAt: start });
  expect(res.status).toBe(200);
  expect(res.body.data).toMatchObject({ status: 'RESCHEDULED', requestedStartAt: '2035-01-02T04:00:00.000Z', confirmedAt: null, confirmedByUserId: null });
  expect(state.visits[0]).toMatchObject({ id: visitId, status: 'CANCELLED', assignedStaffUserId: null });
  expect(state.assignments[0].status).toBe('CANCELLED');
  expect(state.visits.filter(v => v.status === 'SCHEDULED').map(v => v.sequenceNo)).toEqual([2, 3]);
  expect(new Set(state.visits.map(v => v.sequenceNo)).size).toBe(3);
  expect(state.notifications).toHaveLength(1);
  expect(state.notifications[0]).toMatchObject({ templateCode: 'BOOKING_RESCHEDULED', recipient: '+923001234567', templateData: { newDate: '2035-01-02T04:00:00.000Z' } });
  expect(notificationQueue.add).toHaveBeenCalledWith('send', { notificationLogId: 'notif-0' });
  expect(db.notificationLog.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'FAILED', providerError: 'VISIT_SUPERSEDED' } }));
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
});

it.each([['CUSTOMER', 'other'], ['STAFF', 'staff']])('denies %s without authorized ownership', async (role, user) => {
  const before = structuredClone(state);
  const res = await request(app).patch(`/bookings/${id}/reschedule`).set('x-role', role).set('x-user', user).send({ requestedStartAt: start });
  expect(res.status).toBe(403); expect(state).toEqual(before); expect(notificationQueue.add).not.toHaveBeenCalled();
});

it.each(['yesterday', '2020-01-01T00:00:00Z', '2035-01-01T12:00', '2035-02-30T00:00:00Z'])('rejects invalid/past/timezone-less dates: %s', async date => {
  const res = await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: date });
  expect(res.status).toBe(400); expect(db.booking.update).not.toHaveBeenCalled();
});

it.each(['PENDING', 'PENDING_DOCTOR', 'TIME_PROPOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])('rejects booking state %s without notification', async status => {
  state.booking.status = status;
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(409);
  expect(db.bookingVisit.createMany).not.toHaveBeenCalled(); expect(notificationQueue.add).not.toHaveBeenCalled();
});

it.each(['EN_ROUTE', 'CHECKED_IN', 'COMPLETED', 'MISSED'])('protects %s visits even with a stale CONFIRMED booking state', async status => {
  state.visits[0].status = status; const before = structuredClone(state);
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(409);
  expect(state).toEqual(before);
});

it.each(['checkInAt', 'checkOutAt', 'visitNotes', 'beforeConditionText', 'afterConditionText', 'report', 'review', 'booking-report'])('protects existing clinical data: %s', async field => {
  if (field === 'report') state.visits[0]._count.reports = 1;
  else if (field === 'review') state.visits[0]._count.reviews = 1;
  else if (field === 'booking-report') state.booking._count.reports = 1;
  else Object.assign(state.visits[0], { [field]: field.endsWith('At') ? new Date() : 'Clinical note' });
  const before = structuredClone(state);
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(409);
  expect(state).toEqual(before);
  expect(canRescheduleBooking({ ...state.booking, visits: state.visits })).toBe(false);
});

it('rolls back booking, visits and assignments when notification persistence fails', async () => {
  const before = structuredClone(state);
  db.notificationLog.create.mockRejectedValue(new Error('DB unavailable'));
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(500);
  expect(state).toEqual(before); expect(notificationQueue.add).not.toHaveBeenCalled();
});

it('keeps the saved notification when queue delivery fails after commit', async () => {
  jest.mocked(notificationQueue.add).mockRejectedValue(new Error('Queue unavailable'));
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(200);
  expect(state.booking.status).toBe('RESCHEDULED'); expect(state.notifications).toHaveLength(1);
});

it('requires reconfirmation, reuses the payment, and supports another reschedule without sequence collisions', async () => {
  await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start });
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(409);
  expect((await request(app).patch(`/bookings/${id}/confirm`).send()).status).toBe(403);
  const confirmed = await request(app).patch(`/bookings/${id}/confirm`).set('x-role', 'ADMIN');
  expect(confirmed.status).toBe(200); expect(state.booking.status).toBe('CONFIRMED');
  expect(state.payments).toHaveLength(1); expect(db.payment.create).not.toHaveBeenCalled();
  expect(state.notifications[1]).toMatchObject({ templateCode: 'BOOKING_CONFIRMED', templateData: { scheduledDate: '2035-01-02T04:00:00.000Z' } });
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: '2035-02-01T00:00:00Z' })).status).toBe(200);
  expect(state.visits.filter(v => v.status !== 'CANCELLED')).toHaveLength(2);
  expect(new Set(state.visits.map(v => v.sequenceNo)).size).toBe(state.visits.length);
});

it.each(['CUSTOMER', 'ADMIN'])('allows %s to cancel RESCHEDULED and removes its active schedule', async role => {
  state.booking.status = 'RESCHEDULED'; state.visits[0].status = 'SCHEDULED';
  const res = await request(app).patch(`/bookings/${id}/cancel`).set('x-role', role).send({ reason: 'Cancel replacement' });
  expect(res.status).toBe(200); expect(state.booking.status).toBe('CANCELLED');
  expect(state.visits.every(v => v.status === 'CANCELLED')).toBe(true);
});

it('returns a conflict on concurrent reschedule serialization failures', async () => {
  (prisma.$transaction as jest.Mock).mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Concurrent write', { code: 'P2034', clientVersion: '5.22.0' }));
  expect((await request(app).patch(`/bookings/${id}/reschedule`).send({ requestedStartAt: start })).status).toBe(409);
  expect(notificationQueue.add).not.toHaveBeenCalled();
});

it('rejects assignment before reconfirmation', async () => {
  state.booking.status = 'RESCHEDULED';
  const res = await request(app).post(`/bookings/${id}/assignments`).set('x-role', 'ADMIN').send({ visitId, staffUserId: id });
  expect(res.status).toBe(409); expect(res.body.error.code).toBe('BOOKING_NOT_CONFIRMED');
});

it.each(['check-in', 'en-route'])('does not revive a cancelled visit during staff %s', async action => {
  db.bookingVisit.findUnique.mockImplementation(async () => {
    const snapshot = structuredClone(state.visits[0]);
    state.visits[0].status = 'CANCELLED';
    state.visits[0].assignedStaffUserId = null;
    return snapshot;
  });
  db.bookingVisit.update.mockImplementation(async ({ where }: { where: Row }) => {
    expect(where).toMatchObject({ id: visitId, status: 'ASSIGNED', assignedStaffUserId: 'staff' });
    if (!matches(state.visits[0], where)) throw new Prisma.PrismaClientKnownRequestError('Changed', { code: 'P2025', clientVersion: '5.22.0' });
    throw new Error('A cancelled visit must not match');
  });
  const res = await request(app).patch(`/visits/${visitId}/${action}`).set('x-role', 'STAFF').set('x-user', 'staff').send({ checkInLatitude: 1, checkInLongitude: 1 });
  expect(res.status).toBe(409);
  expect(state.visits[0]).toMatchObject({ status: 'CANCELLED', assignedStaffUserId: null, checkInAt: null });
  expect(db.booking.update).not.toHaveBeenCalled();
});
