import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
jest.mock('../../src/config/database', () => ({ prisma: {
  booking: { findUnique: jest.fn() },
  bookingVisit: { findUnique: jest.fn(), findFirst: jest.fn() },
  review: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../src/middleware/auth.middleware', () => ({ authenticateToken(req: Request, _res: Response, next: NextFunction) {
  req.user = { sub: req.header('x-user') ?? 'owner', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 }; next();
} }));
import routes from '../../src/routes/review.routes';
import { prisma } from '../../src/config/database';
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const transaction = prisma.$transaction as jest.Mock;
const bookingId = '00000000-0000-4000-8000-000000000001';
const visitId = '00000000-0000-4000-8000-000000000002';
const staffId = '00000000-0000-4000-8000-000000000003';
const app = express(); app.use(express.json()); app.use('/reviews', routes);
app.use((err: {statusCode?: number; code?: string}, _req: Request, res: Response, _next: NextFunction) => { res.status(err.statusCode ?? 400).json({code: err.code}); });
beforeEach(() => {
  jest.resetAllMocks();
  transaction.mockImplementation((fn: (tx: typeof prisma) => unknown) => fn(prisma));
  db.booking.findUnique.mockResolvedValue({ id: bookingId, customerUserId: 'owner', status: 'COMPLETED' });
  db.bookingVisit.findUnique.mockResolvedValue({ id: visitId, bookingId, status: 'COMPLETED', assignedStaffUserId: staffId });
  db.bookingVisit.findFirst.mockResolvedValue({ bookingId, status: 'COMPLETED', assignedStaffUserId: staffId });
  db.review.findUnique.mockResolvedValue({ id: 'review', bookingId, customerUserId: 'owner', staffUserId: staffId });
  db.review.create.mockImplementation(async ({ data }) => ({ id: 'review', ...data }));
});
it.each([['CUSTOMER', 'owner', 200], ['CUSTOMER', 'stranger', 403], ['STAFF', staffId, 200], ['STAFF', 'stranger', 403], ['ADMIN', 'admin', 200]])('restricts detail access for %s %s', async (role, user, status) => {
  expect((await request(app).get('/reviews/review').set('x-role', role).set('x-user', user)).status).toBe(status);
});
it.each(['STAFF', 'ADMIN'])('rejects %s review creation', async role => {
  expect((await request(app).post('/reviews').set('x-role', role).send({bookingId, rating: 5})).status).toBe(403);
  expect(db.review.create).not.toHaveBeenCalled();
});
it('rejects another customer and mismatched visit without writing', async () => {
  expect((await request(app).post('/reviews').set('x-user', 'stranger').send({bookingId, rating: 5})).status).toBe(422);
  db.bookingVisit.findUnique.mockResolvedValue({ bookingId: 'other', status: 'COMPLETED' });
  const result = await request(app).post('/reviews').send({bookingId, bookingVisitId: visitId, rating: 5});
  expect(result.body.code).toBe('VISIT_NOT_ACCESSIBLE');
  expect(db.review.create).not.toHaveBeenCalled();
});
it('rejects a fabricated staff target', async () => {
  db.bookingVisit.findFirst.mockResolvedValue(null);
  const result = await request(app).post('/reviews').send({bookingId, staffUserId: staffId, rating: 5});
  expect(result.body.code).toBe('STAFF_NOT_ACCESSIBLE');
  expect(db.review.create).not.toHaveBeenCalled();
});
it('permits a completed visit before the recurring booking ends', async () => {
  db.booking.findUnique.mockResolvedValue({ id: bookingId, customerUserId: 'owner', status: 'IN_PROGRESS' });
  const result = await request(app).post('/reviews').send({bookingId, bookingVisitId: visitId, staffUserId: staffId, rating: 4});
  expect(result.status).toBe(201);
  expect(result.body.data.customerUserId).toBe('owner');
  expect(transaction).toHaveBeenCalledWith(expect.any(Function), {isolationLevel: 'Serializable'});
});
it('retains booking-level review payload compatibility', async () => {
  expect((await request(app).post('/reviews').send({bookingId, rating: 5, reviewText: 'Good care'})).status).toBe(201);
});
it('rejects unfinished visits, unfinished bookings and duplicates', async () => {
  db.bookingVisit.findUnique.mockResolvedValue({ bookingId, status: 'STARTED' });
  expect((await request(app).post('/reviews').send({bookingId, bookingVisitId: visitId, rating: 5})).body.code).toBe('VISIT_NOT_COMPLETED');
  db.booking.findUnique.mockResolvedValue({ id: bookingId, customerUserId: 'owner', status: 'ASSIGNED' });
  expect((await request(app).post('/reviews').send({bookingId, rating: 5})).body.code).toBe('BOOKING_NOT_COMPLETED');
  db.booking.findUnique.mockResolvedValue({ id: bookingId, customerUserId: 'owner', status: 'COMPLETED' });
  db.review.findFirst.mockResolvedValue({ id: 'existing' });
  expect((await request(app).post('/reviews').send({bookingId, rating: 5})).body.code).toBe('REVIEW_ALREADY_EXISTS');
  expect(db.review.create).not.toHaveBeenCalled();
});
it('returns a retryable conflict after a concurrent transaction conflict', async () => {
  transaction.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: 'test' }));
  expect((await request(app).post('/reviews').send({bookingId, rating: 5})).status).toBe(409);
});

it('does not grant staff access based on an unverified historical staff ID', async () => {
  db.bookingVisit.findFirst.mockResolvedValue(null);
  expect((await request(app).get('/reviews/review').set('x-role', 'STAFF').set('x-user', staffId)).status).toBe(403);
});
