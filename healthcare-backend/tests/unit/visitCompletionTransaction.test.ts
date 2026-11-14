import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
jest.mock('../../src/config/database', () => ({ prisma: { bookingVisit: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() }, booking: { update: jest.fn() }, notificationLog: { create: jest.fn() }, $transaction: jest.fn() } }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
import { prisma } from '../../src/config/database';
import { notificationQueue } from '../../worker/notification.worker';
import { visitController } from '../../src/controller/visit.controller';
const db = prisma as unknown as { bookingVisit: Record<string, jest.Mock>; booking: Record<string, jest.Mock>; notificationLog: Record<string, jest.Mock>; $transaction: jest.Mock };
const queue = notificationQueue.add as jest.Mock;
const next = jest.fn() as NextFunction & jest.Mock;
const res = { locals: {}, status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
const req = { user: { sub: 'staff', role: 'STAFF' }, params: { id: 'v' }, headers: {} } as unknown as Request;
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(res.status).mockReturnValue(res);
  db.bookingVisit.findUnique.mockResolvedValue({ id: 'v', bookingId: 'b', status: 'CHECKED_IN', assignedStaffUserId: 'staff', booking: { bookingNumber: '1', customerUserId: 'customer', address: { contactPhone: null }, customer: { phone: '03000000000' } } });
  db.bookingVisit.update.mockResolvedValue({ id: 'v', status: 'COMPLETED' });
  db.bookingVisit.count.mockResolvedValue(0);
  db.notificationLog.create.mockResolvedValue({ id: 'n' });
  db.$transaction.mockImplementation(async (callback) => callback(db));
  queue.mockResolvedValue(undefined);
});
it('commits the visit, booking and notification together before queueing', async () => {
  await visitController.complete(req, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
  expect(db.bookingVisit.update.mock.calls[0][0].where).toEqual({ id: 'v', status: 'CHECKED_IN', assignedStaffUserId: 'staff' });
  expect(db.booking.update.mock.calls[0][0].where).toEqual({ id: 'b', status: 'IN_PROGRESS' });
  expect(db.notificationLog.create).toHaveBeenCalled();
  expect(queue).toHaveBeenCalledWith('send', { notificationLogId: 'n' });
});
it('does not queue a notification when its transaction fails', async () => {
  db.notificationLog.create.mockRejectedValue(new Error('database failure'));
  await visitController.complete(req, res, next);
  expect(next).toHaveBeenCalled(); expect(queue).not.toHaveBeenCalled();
});
it('does not mark a recurring booking complete when visits remain', async () => {
  db.bookingVisit.count.mockResolvedValue(1);
  await visitController.complete(req, res, next);
  expect(db.booking.update).not.toHaveBeenCalled(); expect(db.notificationLog.create).toHaveBeenCalled();
});
it('returns conflict on concurrent update and does not notify', async () => {
  db.bookingVisit.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2025', clientVersion: 'test' }));
  await visitController.complete(req, res, next);
  expect(next.mock.calls[0][0].code).toBe('VISIT_CHANGED'); expect(queue).not.toHaveBeenCalled();
});
it('rejects unrelated staff without updating', async () => {
  db.bookingVisit.findUnique.mockResolvedValue({ id: 'v', assignedStaffUserId: 'other' });
  await visitController.complete(req, res, next);
  expect(next.mock.calls[0][0].statusCode).toBe(403); expect(db.$transaction).not.toHaveBeenCalled();
});
