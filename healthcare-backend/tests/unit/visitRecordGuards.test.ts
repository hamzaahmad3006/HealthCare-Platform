import { Request, Response, NextFunction } from 'express';
jest.mock('../../src/config/database', () => ({ prisma: { bookingVisit: { findUnique: jest.fn(), update: jest.fn() } } }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
import { prisma } from '../../src/config/database';
import { visitController } from '../../src/controller/visit.controller';
const visits = prisma.bookingVisit as unknown as { findUnique: jest.Mock; update: jest.Mock };
const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
const next = jest.fn() as NextFunction & jest.Mock;
const req = (body: object = {}) => ({ user: { sub: 'staff', role: 'STAFF' }, params: { id: 'visit' }, headers: {}, body }) as unknown as Request;
beforeEach(() => { jest.resetAllMocks(); });
it('prevents overwriting completed clinical data on repeat checkout', async () => {
  visits.findUnique.mockResolvedValue({ id: 'visit', assignedStaffUserId: 'staff', status: 'CHECKED_IN', checkOutAt: new Date() });
  await visitController.checkOut(req({ visitNotes: 'replacement' }), response, next);
  expect(visits.update).not.toHaveBeenCalled(); expect(next.mock.calls[0][0].code).toBe('VISIT_ALREADY_CHECKED_OUT');
});
it('guards checkout against concurrent status and assignment changes', async () => {
  visits.findUnique.mockResolvedValue({ id: 'visit', assignedStaffUserId: 'staff', status: 'CHECKED_IN', checkOutAt: null });
  visits.update.mockResolvedValue({ id: 'visit' });
  await visitController.checkOut(req({ visitNotes: 'care' }), response, next);
  expect(visits.update.mock.calls[0][0].where).toEqual({ id: 'visit', status: 'CHECKED_IN', checkOutAt: null, assignedStaffUserId: 'staff' });
});
it.each(['CHECKED_IN', 'COMPLETED', 'CANCELLED', 'MISSED'])('prevents marking a %s visit missed', async status => {
  visits.findUnique.mockResolvedValue({ id: 'visit', status });
  await visitController.miss(req({ reason: 'test' }), response, next);
  expect(visits.update).not.toHaveBeenCalled(); expect(next.mock.calls[0][0].code).toBe('INVALID_VISIT_TRANSITION');
});
