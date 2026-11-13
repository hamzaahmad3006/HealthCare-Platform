import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { API as webApi } from '../../../healthcare-web/src/constant/apiUrls';
import { API as mobileApi } from '../../../healthcare-mobile/src/api/endpoints';
jest.mock('../../src/config/database', () => ({ prisma: {
  staffProfile: { findFirst: jest.fn() }, notificationLog: { findMany: jest.fn() },
} }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = { sub: req.header('x-user') ?? 'customer', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 }; next();
  },
}));
import routes from '../../src/routes/notification.routes';
import { prisma } from '../../src/config/database';
import { AppError } from '../../src/utils/stateMachine';
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
type Row = Record<string, unknown>;
function matches(row: Row | null | undefined, where: Row): boolean {
  if (!row) return false;
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return (value as Row[]).some(w => matches(row, w));
    if (key === 'AND') return (value as Row[]).every(w => matches(row, w));
    if (value && typeof value === 'object') {
      const filter = value as Row;
      if ('in' in filter) return (filter.in as unknown[]).includes(row[key]);
      if ('some' in filter) return (row[key] as Row[]).some(r => matches(r, filter.some as Row));
      return matches(row[key] as Row, filter);
    }
    return row[key] === value;
  });
}
const booking = { customerUserId: 'customer', visits: [{ assignedStaffUserId: 'assigned' }], preferredDoctorUserId: 'doctor', cityId: 'city', status: 'PENDING_DOCTOR', serviceType: { code: 'VISITING_DOCTOR', isActive: true } };
const logs = [
  { id: 'customer-message', userId: 'customer', bookingId: 'booking', booking },
  { id: 'assigned-message', userId: 'assigned', bookingId: 'booking', booking },
  { id: 'former-message', userId: 'former', bookingId: 'booking', booking },
  { id: 'doctor-request', userId: 'doctor', bookingId: 'booking', booking },
  { id: 'account-message', userId: 'customer', bookingId: null, booking: null },
  { id: 'other-customer', userId: 'other', bookingId: 'other-booking', booking: { ...booking, customerUserId: 'other', visits: [], preferredDoctorUserId: null } },
];
const app = express();
app.use('/notifications', routes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => { res.status(err.statusCode ?? 500).json({ error: { code: err.code } }); });
beforeEach(() => {
  jest.resetAllMocks();
  db.staffProfile.findFirst.mockImplementation(async ({ where }) => where.userId === 'doctor' ? { userId: 'doctor', cityId: 'city' } : null);
  db.notificationLog.findMany.mockImplementation(async ({ where }) => logs.filter(row => matches(row, where)));
});
it.each([
  ['CUSTOMER', 'customer', ['customer-message', 'account-message']],
  ['CUSTOMER', 'other', ['other-customer']],
  ['STAFF', 'assigned', ['assigned-message']],
  ['STAFF', 'former', []],
  ['STAFF', 'unrelated', []],
  ['STAFF', 'doctor', ['doctor-request']],
])('returns only intended, currently authorized messages for %s / %s', async (role, user, ids) => {
  const res = await request(app).get(mobileApi.NOTIFICATIONS.LIST).set('x-role', role).set('x-user', user).expect(200);
  expect(res.body.data.map((n: { id: string }) => n.id)).toEqual(ids);
});
it('does not expose a pending doctor request after eligibility is revoked', async () => {
  db.staffProfile.findFirst.mockResolvedValue(null);
  const res = await request(app).get('/notifications').set('x-role', 'STAFF').set('x-user', 'doctor').expect(200);
  expect(res.body.data).toEqual([]);
});
it('retains admin access and the existing web/mobile data array contract', async () => {
  expect(webApi.NOTIFICATIONS.LIST).toBe(mobileApi.NOTIFICATIONS.LIST);
  const res = await request(app).get(webApi.NOTIFICATIONS.LIST).set('x-role', 'ADMIN').expect(200);
  expect(res.body.success).toBe(true);
  expect(res.body.data).toHaveLength(logs.length);
});
it('does not accept another recipient or assignment supplied through query parameters', async () => {
  const res = await request(app).get('/notifications?userId=customer&bookingId=booking').set('x-role', 'STAFF').set('x-user', 'unrelated').expect(200);
  expect(res.body.data).toEqual([]);
});
