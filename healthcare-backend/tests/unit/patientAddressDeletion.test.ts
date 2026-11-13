import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import routes from '../../src/routes/user.routes';
import { prisma } from '../../src/config/database';
import { globalErrorHandler } from '../../src/middleware/error.middleware';

jest.mock('../../src/config/database', () => ({ prisma: {
  patient: { findUnique: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), create: jest.fn(), update: jest.fn() },
  address: { findUnique: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
  booking: { findFirst: jest.fn() }, report: { findFirst: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = { sub: req.header('x-user') ?? 'owner', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 };
    next();
  },
}));
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const id = '00000000-0000-4000-8000-000000000001';
const app = express();
app.use(express.json());
app.use('/users', routes);
app.use(globalErrorHandler);
beforeEach(() => {
  jest.resetAllMocks();
  (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma));
  db.patient.findUnique.mockResolvedValue({ id, customerUserId: 'owner' });
  db.address.findUnique.mockResolvedValue({ id, customerUserId: 'owner' });
  db.booking.findFirst.mockResolvedValue(null);
  db.report.findFirst.mockResolvedValue(null);
  db.patient.findFirst.mockResolvedValue(null);
  db.patient.delete.mockResolvedValue({ id });
  db.address.delete.mockResolvedValue({ id });
  db.patient.create.mockResolvedValue({ id });
  db.patient.update.mockResolvedValue({ id });
  db.address.findFirst.mockImplementation(async ({ where }) => where.customerUserId === 'owner' ? { id } : null);
});
const patient = `/users/patients/${id}`;
const address = `/users/addresses/${id}`;

it.each([patient, address])('allows deleting an unused owned record (%s)', async path => {
  await request(app).delete(path).expect(200);
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  expect(path === patient ? db.patient.delete : db.address.delete).toHaveBeenCalledWith({ where: { id } });
});
it.each([patient, address])('does not expose or delete another customer’s record (%s)', async path => {
  const res = await request(app).delete(path).set('x-user', 'unrelated').expect(403);
  expect(res.body.error.code).toBe('FORBIDDEN');
  expect(db.booking.findFirst).not.toHaveBeenCalled();
  expect(db.patient.delete).not.toHaveBeenCalled();
  expect(db.address.delete).not.toHaveBeenCalled();
});
it.each([patient, address])('admin can delete unused records but staff cannot (%s)', async path => {
  await request(app).delete(path).set('x-role', 'STAFF').expect(403);
  await request(app).delete(path).set('x-role', 'ADMIN').expect(200);
});
it.each(['PENDING', 'PENDING_DOCTOR', 'TIME_PROPOSED', 'RESCHEDULED', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])('preserves patient and address history for %s bookings', async status => {
  db.booking.findFirst.mockImplementation(async ({ where }) => ({ id: 'booking', status, ...where }));
  for (const path of [patient, address]) {
    const res = await request(app).delete(path).expect(422);
    expect(res.body.error.code).toBe(path === patient ? 'PATIENT_HAS_HISTORY' : 'ADDRESS_IN_USE');
  }
  expect(db.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { patientId: id }, select: { id: true } }));
  expect(db.booking.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { addressId: id }, select: { id: true } }));
  expect(db.patient.delete).not.toHaveBeenCalled();
  expect(db.address.delete).not.toHaveBeenCalled();
});
it('retains a patient referenced by a report even when no booking row remains', async () => {
  db.report.findFirst.mockResolvedValue({ id: 'report' });
  const res = await request(app).delete(patient).expect(422);
  expect(res.body.error.code).toBe('PATIENT_HAS_HISTORY');
  expect(db.patient.delete).not.toHaveBeenCalled();
});
it('retains an address selected as a patient default', async () => {
  db.patient.findFirst.mockResolvedValue({ id: 'patient' });
  const res = await request(app).delete(address).expect(422);
  expect(res.body.error.code).toBe('ADDRESS_IN_USE');
  expect(db.address.delete).not.toHaveBeenCalled();
});
it.each([patient, address])('returns a clear conflict for a concurrent foreign-key insert (%s)', async path => {
  const failure = new Prisma.PrismaClientKnownRequestError('Foreign key conflict', { code: 'P2003', clientVersion: '5.22.0' });
  (path === patient ? db.patient.delete : db.address.delete).mockRejectedValue(failure);
  const res = await request(app).delete(path).expect(422);
  expect(res.body.error.code).toBe(path === patient ? 'PATIENT_HAS_HISTORY' : 'ADDRESS_IN_USE');
});

it('allows a customer to create a patient with their own default address', async () => {
  await request(app).post('/users/patients').send({ fullName: 'Test Patient', defaultAddressId: id, dateOfBirth: '2000-02-29' }).expect(201);
  expect(db.address.findFirst).toHaveBeenCalledWith({ where: { id, customerUserId: 'owner' }, select: { id: true } });
  expect(db.patient.create).toHaveBeenCalledTimes(1);
});
it('rejects another customer’s default address on patient creation', async () => {
  db.address.findFirst.mockResolvedValue(null);
  const res = await request(app).post('/users/patients').send({ fullName: 'Test Patient', defaultAddressId: id }).expect(422);
  expect(res.body.error.code).toBe('PATIENT_ADDRESS_MISMATCH');
  expect(db.patient.create).not.toHaveBeenCalled();
});
it('rejects a foreign default address during an authorized patient update', async () => {
  db.address.findFirst.mockResolvedValue(null);
  const res = await request(app).patch(`/users/patients/${id}`).send({ defaultAddressId: id }).expect(422);
  expect(res.body.error.code).toBe('PATIENT_ADDRESS_MISMATCH');
  expect(db.patient.update).not.toHaveBeenCalled();
});
it('checks the patient owner’s address even when an admin updates the patient', async () => {
  db.address.findFirst.mockResolvedValue(null);
  await request(app).patch(`/users/patients/${id}`).set('x-role', 'ADMIN').send({ defaultAddressId: id }).expect(422);
  expect(db.address.findFirst).toHaveBeenCalledWith({ where: { id, customerUserId: 'owner' }, select: { id: true } });
});
it.each(['not-a-date', '2001-02-29', '2025-02-30'])('rejects invalid patient date of birth %s before writing', async value => {
  await request(app).post('/users/patients').send({ fullName: 'Test Patient', dateOfBirth: value }).expect(400);
  expect(db.patient.create).not.toHaveBeenCalled();
});
