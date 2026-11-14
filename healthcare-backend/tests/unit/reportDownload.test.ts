import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { API as webApi } from '../../../healthcare-web/src/constant/apiUrls';

jest.mock('../../src/config/database', () => ({ prisma: {
  report: { findUnique: jest.fn() }, reportFile: { findFirst: jest.fn() },
  booking: { findFirst: jest.fn(), findUnique: jest.fn() }, bookingVisit: { findUnique: jest.fn() },
} }));
jest.mock('../../src/helper/cloudinary.helper', () => ({ signDeliveryUrl: jest.fn(() => 'https://res.cloudinary.com/test/report.pdf'), getPresignedUploadUrl: jest.fn(), deleteFile: jest.fn() }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
jest.mock('../../src/middleware/verifiedStaff.middleware', () => ({ verifiedStaff: (_req: Request, _res: Response, next: NextFunction) => next() }));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = { sub: req.header('x-user') ?? 'customer', role: (req.header('x-role') ?? 'CUSTOMER') as 'CUSTOMER', phone: '', session_id: '', iat: 0, exp: 0 }; next();
  },
}));
import routes from '../../src/routes/report.routes';
import { prisma } from '../../src/config/database';
import { signDeliveryUrl } from '../../src/helper/cloudinary.helper';
import { globalErrorHandler } from '../../src/middleware/error.middleware';
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const reportId = '00000000-0000-4000-8000-000000000001';
const fileId = '00000000-0000-4000-8000-000000000002';
const bookingId = '00000000-0000-4000-8000-000000000003';
const patientId = '00000000-0000-4000-8000-000000000004';
const url = webApi.REPORTS.DOWNLOAD_FILE(reportId, fileId);
const app = express();
app.use('/reports', routes);
app.use(globalErrorHandler);
const originalFetch = global.fetch;
const fetchMock = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = fetchMock;
  db.report.findUnique.mockResolvedValue({ id: reportId, bookingId, patientId, bookingVisitId: null, uploadedByUserId: 'assigned', isVisibleToCustomer: true, booking: { customerUserId: 'customer' } });
  db.reportFile.findFirst.mockResolvedValue({ id: fileId, fileUrl: 'https://res.cloudinary.com/test/report.pdf', mimeType: 'application/pdf', fileSizeBytes: BigInt(4) });
  db.booking.findFirst.mockImplementation(async ({ where }) => where.AND?.[0]?.OR?.[0]?.visits?.some?.assignedStaffUserId === 'assigned' ? { id: bookingId } : null);
  db.booking.findUnique.mockResolvedValue({ patientId });
  fetchMock.mockResolvedValue({ ok: true, headers: { get: () => '4' }, arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer });
  (signDeliveryUrl as jest.Mock).mockReturnValue('https://res.cloudinary.com/test/report.pdf');
});
afterAll(() => { global.fetch = originalFetch; });
it.each([['CUSTOMER', 'customer'], ['STAFF', 'assigned'], ['ADMIN', 'admin']])('serves a fresh authorized download to %s', async (role, user) => {
  const res = await request(app).get(url).set('x-role', role).set('x-user', user).expect(200);
  expect([...res.body]).toEqual([1, 2, 3, 4]);
  expect(res.headers['content-disposition']).toBe(`attachment; filename="report-${reportId}.pdf"`);
  expect(res.headers['cache-control']).toBe('private, no-store');
  expect(signDeliveryUrl).toHaveBeenCalledTimes(1);
});
it('rejects another customer before reading the file or contacting storage', async () => {
  await request(app).get(url).set('x-user', 'other').expect(403);
  expect(db.reportFile.findFirst).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects hidden reports for customers, while admin retains access', async () => {
  const row = await db.report.findUnique({ where: { id: reportId } });
  db.report.findUnique.mockResolvedValue({ ...row, isVisibleToCustomer: false });
  await request(app).get(url).expect(403);
  await request(app).get(url).set('x-role', 'ADMIN').expect(200);
});
it('rejects a former staff uploader who no longer has booking access', async () => {
  const row = await db.report.findUnique({ where: { id: reportId } });
  db.report.findUnique.mockResolvedValue({ ...row, uploadedByUserId: 'former' });
  await request(app).get(url).set('x-role', 'STAFF').set('x-user', 'former').expect(403);
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects a file ID outside this report', async () => {
  db.reportFile.findFirst.mockResolvedValue(null);
  await request(app).get(url).expect(404);
  expect(db.reportFile.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: fileId, reportId } }));
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([false, true])('returns a clear upstream error without leaking storage content (network failure: %s)', async networkFailure => {
  if (networkFailure) fetchMock.mockRejectedValue(new Error('provider private details'));
  else fetchMock.mockResolvedValue({ ok: false, headers: { get: () => null } });
  const res = await request(app).get(url).expect(502);
  expect(res.body.error.code).toBe('REPORT_FILE_UNAVAILABLE');
  expect(JSON.stringify(res.body)).not.toContain('provider private details');
});
it('rejects an oversized legacy file before contacting storage', async () => {
  db.reportFile.findFirst.mockResolvedValue({ fileSizeBytes: BigInt(11 * 1024 * 1024) });
  await request(app).get(url).expect(502);
  expect(fetchMock).not.toHaveBeenCalled();
});
