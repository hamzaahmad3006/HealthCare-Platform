jest.mock('../../src/config/env', () => ({ env: { CLOUDINARY_CLOUD_NAME: 'test' } }));
import { API as webApi } from '../../../healthcare-web/src/constant/apiUrls';
import { API as mobileApi } from '../../../healthcare-mobile/src/api/endpoints';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';

jest.mock('../../src/config/database', () => ({ prisma: {
  staffProfile: { findFirst: jest.fn() },
  booking: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
  bookingVisit: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
  bookingAssignment: { updateMany: jest.fn() },
  notificationLog: { updateMany: jest.fn(), create: jest.fn() },
  patient: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  report: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  reportFile: { create: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../worker/notification.worker', () => ({ notificationQueue: { add: jest.fn() } }));
jest.mock('../../src/helper/cloudinary.helper', () => ({ getPresignedUploadUrl: jest.fn(), signDeliveryUrl: jest.fn((url: string) => url) }));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = { sub: req.header('x-user') ?? 'staff', role: (req.header('x-role') ?? 'STAFF') as 'STAFF', phone: '', session_id: '', iat: 0, exp: 0 };
    next();
  },
}));
jest.mock('../../src/middleware/idempotency.middleware', () => ({ idempotencyMiddleware: (_req: Request, _res: Response, next: NextFunction) => next() }));
jest.mock('../../src/middleware/rateLimit.middleware', () => ({ uploadLimiter: (_req: Request, _res: Response, next: NextFunction) => next() }));

import bookingRoutes from '../../src/routes/booking.routes';
import reportRoutes from '../../src/routes/report.routes';
import userRoutes from '../../src/routes/user.routes';
import visitRoutes from '../../src/routes/visit.routes';
import { prisma } from '../../src/config/database';
import { getPresignedUploadUrl } from '../../src/helper/cloudinary.helper';
import { notificationQueue } from '../../worker/notification.worker';
import { ZodError } from 'zod';
import { AppError } from '../../src/utils/stateMachine';

const db = prisma as unknown as {
  [model: string]: { [method: string]: jest.Mock };
};
const bookingId = '00000000-0000-4000-8000-000000000001';
const patientId = '00000000-0000-4000-8000-000000000002';
const visitId = '00000000-0000-4000-8000-000000000003';
const otherId = '00000000-0000-4000-8000-000000000004';
const reportId = '00000000-0000-4000-8000-000000000005';
const visits = [
  { id: visitId, bookingId, assignedStaffUserId: 'staff', status: 'ASSIGNED' },
  { id: otherId, bookingId, assignedStaffUserId: 'other-staff', status: 'ASSIGNED' },
];
const booking = { id: bookingId, patientId, customerUserId: 'customer', status: 'ASSIGNED', preferredDoctorUserId: 'doctor', serviceType: { code: 'VISITING_DOCTOR', isActive: true }, visits };

// Small fixture query adapter exercises the server's actual Prisma filters. An
// omitted ownership/assignment predicate returns other users' rows and fails tests.
type Row = { [key: string]: unknown };
function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (key === 'AND') return (value as Row[]).every(w => matches(row, w));
    if (key === 'OR') return (value as Row[]).some(w => matches(row, w));
    if (value && typeof value === 'object') {
      const filter = value as Row;
      if ('in' in filter) return (filter.in as unknown[]).includes(row[key]);
      if ('some' in filter) return (row[key] as Row[]).some(r => matches(r, filter.some as Row));
      return matches(row[key] as Row, filter);
    }
    return row[key] === value;
  });
}

const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);
app.use('/reports', reportRoutes);
app.use('/users', userRoutes);
app.use('/visits', visitRoutes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err instanceof ZodError ? 400 : err.statusCode ?? 500).json({ error: { code: err.code } });
});

beforeEach(() => {
  jest.clearAllMocks();
  db.reportFile.findFirst.mockReset();
  db.notificationLog.create.mockReset();
  (prisma.$transaction as jest.Mock).mockImplementation((arg: unknown) => typeof arg === 'function' ? arg(prisma) : Promise.all(arg as Promise<unknown>[]));
  db.staffProfile.findFirst.mockImplementation(async ({ where }: { where: Row }) => where.userId === 'doctor' ? { userId: 'doctor', user: { phone: '+923000000001' } } : null);
  booking.status = 'ASSIGNED';
  const all = [booking, { ...booking, id: otherId, customerUserId: 'other-customer', preferredDoctorUserId: null, visits: [] }];
  db.booking.findFirst.mockImplementation(async ({ where }: { where: Row }) => all.find(b => matches(b, where)) ?? null);
  db.booking.findUnique.mockImplementation(async ({ where, include }: { where: { id: string }; include?: { visits?: { where: Row } } }) => {
    const b = all.find(b => b.id === where.id);
    return b ? { ...b, visits: b.visits.filter(v => matches({ ...v, booking: b }, include?.visits?.where)) } : null;
  });
  db.booking.findMany.mockImplementation(async ({ where }: { where: Row }) => all.filter(b => matches(b, where)));
  db.booking.count.mockImplementation(async ({ where }: { where: Row }) => all.filter(b => matches(b, where)).length);
  db.bookingVisit.findMany.mockImplementation(async ({ where }: { where: Row }) => visits.filter(v => matches({ ...v, booking }, where)));
  db.bookingVisit.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
    const v = visits.find(v => v.id === where.id);
    return v ? { ...v, booking } : null;
  });
  db.patient.findUnique.mockResolvedValue({ id: patientId, customerUserId: 'customer' });
  db.patient.findFirst.mockImplementation(async ({ where }: { where: Row }) => matches({ id: patientId, bookings: [booking] }, where) ? { id: patientId } : null);
  db.patient.findMany.mockImplementation(async ({ where }: { where: Row }) => matches({ id: patientId, bookings: [booking] }, where) ? [{ id: patientId }] : []);
  db.patient.count.mockResolvedValue(1);
  db.report.create.mockImplementation(async ({ data }: { data: Row }) => ({ id: reportId, ...data }));
  const reports = [
    { id: reportId, bookingId, patientId, bookingVisitId: visitId, uploadedByUserId: 'staff', isVisibleToCustomer: true, booking, bookingVisit: visits[0], files: [] },
    { id: otherId, bookingId, patientId, bookingVisitId: visitId, uploadedByUserId: 'staff', isVisibleToCustomer: false, booking, bookingVisit: visits[0], files: [] },
    { id: visitId, bookingId: otherId, patientId, bookingVisitId: null, uploadedByUserId: 'staff', isVisibleToCustomer: true, booking: all[1], bookingVisit: null, files: [] },
  ];
  db.report.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => reports.find(r => r.id === where.id) ?? null);
  db.report.findMany.mockImplementation(async ({ where }: { where: Row }) => reports.filter(r => matches(r, where)));
  db.report.count.mockImplementation(async ({ where }: { where: Row }) => reports.filter(r => matches(r, where)).length);
  db.report.update.mockImplementation(async ({ data }: { data: Row }) => ({ id: reportId, ...data }));
  db.booking.updateMany.mockImplementation(async ({ where }: { where: Row }) => ({ count: matches(booking, where) ? 1 : 0 }));
  db.booking.findUniqueOrThrow.mockResolvedValue(booking);
});

it.each(['', '?doctorRequestsOnly=false', '?status=ASSIGNED'])('scopes the staff booking list without trusting client filters: %s', async query => {
  const res = await request(app).get(`/bookings${query}`);
  expect(res.status).toBe(200);
  expect(res.body.data.map((b: Row) => b.id)).toEqual([bookingId]);
  expect(res.body.meta.total).toBe(1);
});

it.each(['ADMIN', 'CUSTOMER'])('preserves %s list access', async role => {
  const res = await request(app).get('/bookings').set('x-role', role).set('x-user', 'customer');
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(role === 'ADMIN' ? 2 : 1);
});

it.each(['/bookings/' + bookingId, '/bookings/' + bookingId + '/visits', '/users/patients/' + patientId])('denies unrelated staff and customers at %s', async path => {
  for (const role of ['STAFF', 'CUSTOMER']) {
    expect((await request(app).get(path).set('x-role', role).set('x-user', 'unrelated')).status).toBe(403);
  }
});

it.each(['STAFF', 'CUSTOMER', 'ADMIN'])('returns compatible booking envelopes for %s', async role => {
  const actor = role === 'STAFF' ? 'staff' : 'customer';
  const detail = await request(app).get(`/bookings/${bookingId}`).set('x-role', role).set('x-user', actor);
  expect(detail.status).toBe(200);
  expect(detail.body).toMatchObject({ success: true, data: { id: bookingId, patientId } });
  expect(detail.body.data.visits).toHaveLength(role === 'STAFF' ? 1 : 2);
  const schedule = await request(app).get(`/bookings/${bookingId}/visits`).set('x-role', role).set('x-user', actor);
  expect(schedule.status).toBe(200);
  expect(schedule.body.data).toHaveLength(role === 'STAFF' ? 1 : 2);
});

it.each(['PENDING_DOCTOR', 'TIME_PROPOSED'])('keeps preferred doctor access before assignment in %s', async status => {
  booking.status = status;
  for (const path of ['/bookings', '/bookings?doctorRequestsOnly=true', `/bookings/${bookingId}`, `/bookings/${bookingId}/visits`, `/users/patients/${patientId}`]) {
    const res = await request(app).get(path).set('x-user', 'doctor');
    expect(res.status).toBe(200);
    if (path.startsWith('/bookings?')) expect(res.body.data).toHaveLength(1);
  }
});

it('does not grant a preferred doctor access after the request phase or to report creation', async () => {
  expect((await request(app).get(`/bookings/${bookingId}`).set('x-user', 'doctor')).status).toBe(403);
  booking.status = 'PENDING_DOCTOR';
  expect((await request(app).post('/reports').set('x-user', 'doctor').send({ bookingId, patientId, title: 'Note', reportType: 'VISIT_NOTE' })).status).toBe(403);
});

it('uses current assignments for patient reads, excluding unrelated or replaced staff', async () => {
  expect((await request(app).get('/users/patients')).body.data).toHaveLength(1);
  expect((await request(app).get('/users/patients').set('x-user', 'replaced-staff')).body.data).toHaveLength(0);
  expect((await request(app).get(`/users/patients/${patientId}`)).status).toBe(200);
});

it.each(['STAFF', 'CUSTOMER'])('blocks %s cancellation of another customer booking', async role => {
  expect((await request(app).patch(`/bookings/${bookingId}/cancel`).set('x-role', role).set('x-user', 'unrelated').send({ reason: 'Cancel' })).status).toBe(403);
  expect(db.booking.updateMany).not.toHaveBeenCalled();
});

it.each(['CUSTOMER', 'ADMIN'])('allows %s cancellation with ownership scope', async role => {
  booking.status = 'CONFIRMED';
  const res = await request(app).patch(`/bookings/${bookingId}/cancel`).set('x-role', role).set('x-user', 'customer').send({ reason: 'Cancel' });
  expect(res.status).toBe(200);
  expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ AND: [role === 'ADMIN' ? {} : { customerUserId: 'customer' }] }) }));
});

it.each([['web', webApi.REPORTS.LIST], ['mobile', mobileApi.REPORTS.CREATE]])('accepts the existing %s report payload and response', async (_client, endpoint) => {
  const res = await request(app).post(endpoint).send({ bookingId, patientId, bookingVisitId: visitId, title: 'Visit note', reportType: 'VISIT_NOTE', notes: 'Progress', isVisibleToCustomer: true });
  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ success: true, data: { bookingId, patientId, bookingVisitId: visitId, uploadedByUserId: 'staff' } });
});

it('allows booking-level reports and admin reports', async () => {
  for (const role of ['STAFF', 'ADMIN']) expect((await request(app).post('/reports').set('x-role', role).send({ bookingId, patientId, title: 'Note', reportType: 'OTHER' })).status).toBe(201);
});

it.each([
  ['STAFF', 'unrelated', {}, 403],
  ['CUSTOMER', 'customer', {}, 403],
  ['STAFF', 'staff', { patientId: otherId }, 422],
  ['ADMIN', 'admin', { patientId: otherId }, 422],
  ['STAFF', 'staff', { bookingVisitId: otherId }, 403],
  ['ADMIN', 'admin', { bookingVisitId: reportId }, 422],
] as const)('rejects invalid report access/relationships %#', async (role, user, overrides, status) => {
  const res = await request(app).post('/reports').set('x-role', role).set('x-user', user).send({ bookingId, patientId, title: 'Note', reportType: 'OTHER', ...overrides });
  expect(res.status).toBe(status);
  expect(db.report.create).not.toHaveBeenCalled();
});

it('rejects a visit belonging to a different booking even for admin', async () => {
  db.bookingVisit.findUnique.mockResolvedValue({ id: visitId, bookingId: otherId, assignedStaffUserId: 'staff' });
  expect((await request(app).post('/reports').set('x-role', 'ADMIN').send({ bookingId, patientId, bookingVisitId: visitId, title: 'Note', reportType: 'OTHER' })).status).toBe(422);
  expect(db.report.create).not.toHaveBeenCalled();
});

it('does not allow report updates to retarget an unrelated booking or patient', async () => {
  for (const [data, status, code] of [
    [{ bookingId: otherId }, 403, 'FORBIDDEN'],
    [{ patientId: otherId }, 422, 'REPORT_PATIENT_MISMATCH'],
    [{ bookingVisitId: otherId }, 403, 'FORBIDDEN'],
  ] as const) {
    const res = await request(app).patch(`/reports/${reportId}`).send(data);
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  }
  expect(db.report.update).not.toHaveBeenCalled();
});

it('blocks writes by unrelated staff/customers and former assignees', async () => {
  for (const [role, user] of [['STAFF', 'unrelated'], ['CUSTOMER', 'customer']]) {
    expect((await request(app).patch(`/reports/${reportId}`).set('x-role', role).set('x-user', user).send({ title: 'Changed' })).status).toBe(403);
    expect((await request(app).patch(`/users/patients/${patientId}`).set('x-role', role).set('x-user', 'unrelated').send({ fullName: 'Changed' })).status).toBe(403);
    expect((await request(app).patch(`/visits/${visitId}/check-in`).set('x-role', role).set('x-user', 'unrelated').send({ checkInLatitude: 1, checkInLongitude: 1 })).status).toBe(403);
  }
  db.booking.findFirst.mockResolvedValue(null);
  for (const path of [`/reports/${reportId}`, `/reports/${reportId}/files/presign`, `/reports/${reportId}/files/confirm`]) {
    const call = path.endsWith(reportId) ? request(app).patch(path) : request(app).post(path);
    expect((await call.send({ title: 'Changed' })).status).toBe(403);
  }
  expect(db.report.update).not.toHaveBeenCalled();
  expect(db.reportFile.create).not.toHaveBeenCalled();
  expect(db.patient.update).not.toHaveBeenCalled();
  expect(db.bookingVisit.update).not.toHaveBeenCalled();
});

it.each([
  ['web', webApi.BOOKINGS.BY_ID, webApi.BOOKINGS.VISITS],
  ['mobile', mobileApi.BOOKINGS.DETAIL, mobileApi.BOOKINGS.VISITS],
] as const)('serves booking details and visits at the actual %s API paths', async (_client, detail, schedule) => {
  expect((await request(app).get(detail(bookingId))).body.data.id).toBe(bookingId);
  expect((await request(app).get(schedule(bookingId))).body.data[0].id).toBe(visitId);
});

it('allows authorized report edits without changing their target', async () => {
  const res = await request(app).patch(`/reports/${reportId}`).send({ title: 'Progress update' });
  expect(res.status).toBe(200);
  expect(res.body.data.title).toBe('Progress update');
});

it.each([
  ['STAFF', 'staff', 2], ['STAFF', 'unrelated', 0],
  ['CUSTOMER', 'customer', 1], ['CUSTOMER', 'unrelated', 0], ['ADMIN', 'admin', 3],
] as const)('scopes report list for %s %s', async (role, user, count) => {
  const res = await request(app).get('/reports').set('x-role', role).set('x-user', user);
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(count);
  expect(res.body.meta.total).toBe(count);
});

it.each([
  ['STAFF', 'staff', reportId, 200], ['STAFF', 'staff', visitId, 403],
  ['STAFF', 'unrelated', reportId, 403], ['CUSTOMER', 'customer', reportId, 200],
  ['CUSTOMER', 'unrelated', reportId, 403], ['CUSTOMER', 'customer', otherId, 403],
  ['ADMIN', 'admin', otherId, 200],
] as const)('enforces report detail permissions %#', async (role, user, id, status) => {
  expect((await request(app).get(`/reports/${id}`).set('x-role', role).set('x-user', user)).status).toBe(status);
});

it.each([
  ['web', 'STAFF', webApi.REPORTS.PRESIGN, webApi.REPORTS.CONFIRM],
  ['web', 'ADMIN', webApi.REPORTS.PRESIGN, webApi.REPORTS.CONFIRM],
  ['mobile', 'STAFF', mobileApi.REPORTS.FILES_PRESIGN, mobileApi.REPORTS.FILES_CONFIRM],
  ['mobile', 'ADMIN', mobileApi.REPORTS.FILES_PRESIGN, mobileApi.REPORTS.FILES_CONFIRM],
] as const)('preserves the %s report file upload flow for %s', async (_client, role, presign, confirm) => {
  const signedUpload = {
    uploadUrl: 'https://api.cloudinary.com/v1_1/test/image/upload',
    fileKey: `reports/${otherId}/image`,
    expiresIn: 3600,
    uploadParams: { api_key: 'test', timestamp: 1, signature: 'test', public_id: 'image', resource_type: 'image' },
  };
  jest.mocked(getPresignedUploadUrl).mockResolvedValue(signedUpload);
  db.reportFile.create.mockImplementation(async ({ data }: { data: Row }) => ({ id: 'file', ...data }));

  // This fixture is hidden from customers, so upload confirmation does not send
  // an external notification. Authorization still requires the report's booking
  // and visit, even though the client supplies only its report ID.
  const signed = await request(app).post(presign(otherId)).set('x-role', role).send({ mimeType: 'image/png', fileSizeBytes: 100 });
  expect(signed.status).toBe(200);
  expect(signed.body).toMatchObject({ success: true, data: signedUpload });
  expect(getPresignedUploadUrl).toHaveBeenCalledWith(`reports/${otherId}`, 'image/png', 100);

  const confirmed = await request(app).post(confirm(otherId)).set('x-role', role).send({
    fileKey: signed.body.data.fileKey, fileUrl: `https://res.cloudinary.com/test/image/upload/${signedUpload.fileKey}.png`,
    mimeType: 'image/png', fileSizeBytes: 100,
  });
  expect(confirmed.status).toBe(201);
  expect(confirmed.body).toMatchObject({ success: true, data: { reportId: otherId, fileSizeBytes: '100' } });
});

const uploadPayload = () => ({
  fileKey: `reports/${otherId}/test-file`,
  fileUrl: `https://res.cloudinary.com/test/image/upload/v1/reports/${otherId}/test-file.png`,
  mimeType: 'image/png', fileSizeBytes: 100,
});
it.each([
  { fileKey: `reports/${reportId}/other-file` },
  { fileUrl: 'https://external.example/file.png' },
  { fileUrl: `https://res.cloudinary.com/another-cloud/image/upload/reports/${otherId}/test-file.png` },
  { fileUrl: `https://res.cloudinary.com/test/image/upload/reports/${reportId}/test-file.png` },
  { fileUrl: `https://res.cloudinary.com/test/image/upload/reports/${otherId}/test-file.png?download=1` },
])('rejects storage paths outside the signed report target: %j', async override => {
  const response = await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send({ ...uploadPayload(), ...override });
  expect(response.status).toBe(422);
  expect(response.body.error.code).toBe('INVALID_UPLOAD_TARGET');
  expect(db.reportFile.create).not.toHaveBeenCalled();
});
it.each([{ mimeType: 'text/html' }, { fileSizeBytes: 10485761 }, { checksumSha256: 'invalid' }])('rejects invalid confirmation metadata: %j', async override => {
  const response = await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send({ ...uploadPayload(), ...override });
  expect(response.status).toBe(400);
  expect(db.reportFile.create).not.toHaveBeenCalled();
});
async function makeVisibleReport() {
  const original = await db.report.findUnique({ where: { id: otherId } });
  db.report.findUnique.mockResolvedValue({ ...original, isVisibleToCustomer: true,
    patient: { fullName: 'Test Patient' },
    booking: { ...booking, address: { contactPhone: '+923001234567' }, customer: { phone: '+923001234567' } },
  });
  db.notificationLog.create.mockResolvedValue({ id: 'notification' });
  (notificationQueue.add as jest.Mock).mockResolvedValue(undefined);
}
it('commits one file and notification and treats identical confirmation as a retry', async () => {
  await makeVisibleReport();
  let saved: Row | null = null;
  db.reportFile.findFirst.mockImplementation(async () => saved);
  db.reportFile.create.mockImplementation(async ({ data }: { data: Row }) => { saved = { id: 'file', ...data }; return saved; });
  await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send(uploadPayload()).expect(201);
  await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send(uploadPayload()).expect(201);
  expect(db.reportFile.create).toHaveBeenCalledTimes(1);
  expect(db.notificationLog.create).toHaveBeenCalledTimes(1);
  expect(notificationQueue.add).toHaveBeenCalledTimes(1);
  expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' });
});
it('does not overwrite a confirmed file with changed metadata', async () => {
  db.reportFile.findFirst.mockResolvedValue({ ...uploadPayload(), fileSizeBytes: BigInt(101) });
  const response = await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send(uploadPayload());
  expect(response.body.error.code).toBe('UPLOAD_ALREADY_CONFIRMED');
  expect(db.reportFile.create).not.toHaveBeenCalled();
});
it('does not dispatch a notification when the transaction fails', async () => {
  await makeVisibleReport();
  db.reportFile.create.mockImplementation(async ({ data }: { data: Row }) => ({ id: 'file', ...data }));
  db.notificationLog.create.mockRejectedValue(new Error('Test transaction failure'));
  await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send(uploadPayload()).expect(500);
  expect(notificationQueue.add).not.toHaveBeenCalled();
});

it.each([
  ['application/pdf', 'raw', 'pdf'], ['image/jpeg', 'image', 'jpg'], ['image/png', 'image', 'png'],
])('accepts a legitimate %s upload using the existing client payload', async (mimeType, resource, extension) => {
  const payload = { ...uploadPayload(), mimeType, fileUrl: `https://res.cloudinary.com/test/${resource}/upload/v1/reports/${otherId}/test-file.${extension}` };
  db.reportFile.create.mockImplementation(async ({ data }: { data: Row }) => ({ id: 'file', ...data }));
  await request(app).post(mobileApi.REPORTS.FILES_CONFIRM(otherId)).send(payload).expect(201);
  expect(db.notificationLog.create).not.toHaveBeenCalled();
});
it('does not queue a notification when the database rejects the commit', async () => {
  await makeVisibleReport();
  db.reportFile.create.mockImplementation(async ({ data }: { data: Row }) => ({ id: 'file', ...data }));
  (prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
    await fn(prisma);
    throw new Error('Test serialization failure');
  });
  await request(app).post(webApi.REPORTS.CONFIRM(otherId)).send(uploadPayload()).expect(500);
  expect(notificationQueue.add).not.toHaveBeenCalled();
});
