import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { ZodError } from 'zod';

jest.mock('../../src/config/database', () => ({
  prisma: {
    staffProfile: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    serviceType: { findMany: jest.fn() },
    city: { findFirst: jest.fn() },
    zone: { findFirst: jest.fn() },
    staffServiceType: { deleteMany: jest.fn(), createMany: jest.fn() },
    staffDocument: { findMany: jest.fn(), create: jest.fn() },
    bookingVisit: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('../../src/helper/axios', () => ({ sendWhatsAppMessage: jest.fn() }));
jest.mock('../../src/helper/email.helper', () => ({ sendEmail: jest.fn() }));
jest.mock('../../src/helper/cloudinary.helper', () => ({
  getPresignedUploadUrl: jest.fn(),
}));
jest.mock('../../worker/notification.worker', () => ({
  notificationQueue: { add: jest.fn() },
}));
jest.mock('../../src/middleware/rateLimit.middleware', () => ({
  uploadLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken(req: Request, _res: Response, next: NextFunction) {
    req.user = {
      sub: req.header('x-user') ?? 'staff',
      role: (req.header('x-role') ?? 'STAFF') as 'STAFF',
      phone: '',
      session_id: '',
      iat: 0,
      exp: 0,
    };
    next();
  },
}));
import staffRoutes from '../../src/routes/staff.routes';
import visitRoutes from '../../src/routes/visit.routes';
import reportRoutes from '../../src/routes/report.routes';
import bookingRoutes from '../../src/routes/booking.routes';
import { prisma } from '../../src/config/database';
import { getPresignedUploadUrl } from '../../src/helper/cloudinary.helper';
import { AppError } from '../../src/utils/stateMachine';
const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const cityId = '00000000-0000-4000-8000-000000000001';
const serviceId = '00000000-0000-4000-8000-000000000002';
const zoneId = '00000000-0000-4000-8000-000000000003';
const app = express();
app.use(express.json());
app.use('/staff', staffRoutes);
app.use('/visits', visitRoutes);
app.use('/reports', reportRoutes);
app.use('/bookings', bookingRoutes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) =>
  res
    .status(err instanceof ZodError ? 400 : err.statusCode ?? 500)
    .json({ error: { code: err.code } }),
);
const initial = () => ({
  userId: 'staff',
  verificationStatus: 'PENDING',
  profileCompletedAt: null as Date | null,
  staffCode: 'TEST',
  cityId: null as string | null,
  zoneId: null,
  gender: null,
  cnic: null as string | null,
  dateOfBirth: null,
  experienceYears: 0,
  ambulanceNumber: null,
  serviceTypes: [] as { serviceTypeId: string }[],
  isAvailable: false,
  user: { role: 'STAFF', status: 'ACTIVE', deletedAt: null as Date | null },
});
let profile = initial();
let documentStatus = 'PENDING';
let activeService = true;
const profileBody = {
  cityId,
  cnic: '00000-0000000-0',
  experienceYears: 2,
  serviceTypeIds: [serviceId],
};
const documentBody = {
  documentType: 'CNIC',
  fileKey: 'staff/staff/CNIC/test-file',
  fileUrl:
    'https://res.cloudinary.com/test-cloud/raw/upload/v1/staff/staff/CNIC/test-file.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 20,
};
beforeEach(() => {
  jest.resetAllMocks();
  profile = initial();
  documentStatus = 'PENDING';
  activeService = true;
  (prisma.$transaction as jest.Mock).mockImplementation(async cb => {
    const before = structuredClone(profile);
    try {
      return await cb(prisma);
    } catch (err) {
      profile = before;
      throw err;
    }
  });
  db.staffProfile.findUnique.mockImplementation(async ({ where }) =>
    where.userId === profile.userId ? profile : null,
  );
  db.staffProfile.findFirst.mockImplementation(async ({ where }) => {
    const eligible =
      where.userId === profile.userId &&
      profile.verificationStatus === 'VERIFIED' &&
      profile.profileCompletedAt &&
      profile.user.status === 'ACTIVE' &&
      !profile.user.deletedAt;
    return eligible ? { userId: profile.userId } : null;
  });
  db.staffProfile.update.mockImplementation(async ({ where, data }) => {
    expect(where.userId).toBe('staff');
    Object.assign(profile, data);
    return profile;
  });
  db.staffProfile.updateMany.mockImplementation(async ({ where, data }) => {
    if (
      profile.userId === where.userId &&
      profile.verificationStatus === where.verificationStatus
    ) {
      Object.assign(profile, data);
      return { count: 1 };
    }
    return { count: 0 };
  });
  db.serviceType.findMany.mockImplementation(async ({ where }) =>
    activeService && where.isActive ? [{ id: serviceId, code: 'NURSING' }] : [],
  );
  db.city.findFirst.mockImplementation(async ({ where }) =>
    where.id === cityId ? { id: cityId } : null,
  );
  db.zone.findFirst.mockImplementation(async ({ where }) =>
    where.id === zoneId && where.cityId === cityId ? { id: zoneId } : null,
  );
  db.staffDocument.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: 'doc',
    verificationStatus: 'PENDING',
  }));
  db.staffDocument.findMany.mockResolvedValue([
    {
      id: 'doc',
      fileSizeBytes: BigInt(20),
      verificationStatus: documentStatus,
    },
  ]);
  db.bookingVisit.findUnique.mockResolvedValue(null);
  jest.mocked(getPresignedUploadUrl).mockResolvedValue({
    uploadUrl: 'https://example.invalid/upload',
    fileKey: documentBody.fileKey,
    expiresIn: 300,
    uploadParams: {
      api_key: 'test-only',
      timestamp: 1,
      signature: 'test-only',
      public_id: documentBody.fileKey,
      resource_type: 'raw',
    },
  });
});

it('completes only the signed-in staff profile and submits it for review', async () => {
  const res = await request(app)
    .patch('/staff/me/profile')
    .send({ ...profileBody, userId: 'other', verificationStatus: 'VERIFIED' });
  expect(res.status).toBe(200);
  expect(profile.verificationStatus).toBe('PENDING');
  expect(profile.isAvailable).toBe(false);
  expect(db.staffServiceType.createMany).toHaveBeenCalledWith({
    data: [{ staffUserId: 'staff', serviceTypeId: serviceId }],
  });
});
it.each(['CUSTOMER', 'ADMIN'])(
  'blocks %s from staff self-completion',
  async role => {
    expect(
      (
        await request(app)
          .patch('/staff/me/profile')
          .set('x-role', role)
          .send(profileBody)
      ).status,
    ).toBe(403);
    expect(db.staffProfile.update).not.toHaveBeenCalled();
  },
);
it.each([
  { cnic: '-------------' },
  { dateOfBirth: '2030-02-30' },
  { experienceYears: -1 },
  { serviceTypeIds: [] },
  { serviceTypeIds: [serviceId, serviceId] },
])('validates profile data %p', async change => {
  expect(
    (
      await request(app)
        .patch('/staff/me/profile')
        .send({ ...profileBody, ...change })
    ).status,
  ).toBe(400);
});
it('rejects inactive services and zones outside the selected city', async () => {
  activeService = false;
  expect(
    (await request(app).patch('/staff/me/profile').send(profileBody)).status,
  ).toBe(404);
  activeService = true;
  expect(
    (
      await request(app)
        .patch('/staff/me/profile')
        .send({ ...profileBody, zoneId: serviceId })
    ).status,
  ).toBe(400);
  expect(db.staffProfile.update).not.toHaveBeenCalled();
});
it('requires an ambulance registration for ambulance services', async () => {
  db.serviceType.findMany.mockResolvedValue([
    { id: serviceId, code: 'AMBULANCE' },
  ]);
  expect(
    (await request(app).patch('/staff/me/profile').send(profileBody)).body.error
      .code,
  ).toBe('AMBULANCE_NUMBER_REQUIRED');
});
it('returns corrected/rejected profiles to pending and revokes work availability', async () => {
  profile.verificationStatus = 'VERIFIED';
  profile.profileCompletedAt = new Date();
  profile.isAvailable = true;
  expect(
    (await request(app).patch('/staff/me/profile').send(profileBody)).status,
  ).toBe(200);
  expect(profile.verificationStatus).toBe('PENDING');
  expect(profile.isAvailable).toBe(false);
  profile.verificationStatus = 'REJECTED';
  expect(
    (await request(app).patch('/staff/me/profile').send(profileBody)).body.data
      .verificationStatus,
  ).toBe('PENDING');
});
it('preserves verified status for an unchanged profile', async () => {
  Object.assign(profile, profileBody, {
    profileCompletedAt: new Date(),
    verificationStatus: 'VERIFIED',
    serviceTypes: [{ serviceTypeId: serviceId }],
  });
  expect(
    (await request(app).patch('/staff/me/profile').send(profileBody)).body.data
      .verificationStatus,
  ).toBe('VERIFIED');
});
it.each(['presign', 'confirm', 'list'])(
  'blocks unrelated staff and customers from document %s',
  async action => {
    for (const role of ['STAFF', 'CUSTOMER']) {
      const req =
        action === 'list'
          ? request(app).get('/staff/other/documents')
          : request(app)
              .post(`/staff/other/documents/${action}`)
              .send(documentBody);
      expect((await req.set('x-role', role)).status).toBe(403);
    }
    expect(db.staffDocument.create).not.toHaveBeenCalled();
    expect(getPresignedUploadUrl).not.toHaveBeenCalled();
  },
);
it('supports replacement documents while preserving separate staff/document review', async () => {
  profile.verificationStatus = 'REJECTED';
  const res = await request(app)
    .post('/staff/staff/documents/confirm')
    .send(documentBody);
  expect(res.status).toBe(201);
  expect(res.body.data.verificationStatus).toBe('PENDING');
  expect(profile.verificationStatus).toBe('PENDING');
  expect(db.staffDocument.create).toHaveBeenCalledTimes(1);
  expect((await request(app).get('/staff/staff/documents')).status).toBe(200);
});
it.each([
  { fileKey: 'staff/other/CNIC/test-file' },
  { fileKey: 'staff/staff/CNIC/../other' },
  { fileUrl: 'https://example.invalid/foreign' },
  { mimeType: 'application/exe' },
  { fileSizeBytes: 11 * 1024 * 1024 },
])('rejects invalid or foreign upload confirmations %p', async change => {
  expect(
    (
      await request(app)
        .post('/staff/staff/documents/confirm')
        .send({ ...documentBody, ...change })
    ).status,
  ).toBeGreaterThanOrEqual(400);
  expect(db.staffDocument.create).not.toHaveBeenCalled();
});
it('handles presign-provider failure without recording a document', async () => {
  jest
    .mocked(getPresignedUploadUrl)
    .mockRejectedValueOnce(new Error('test provider unavailable'));
  expect(
    (
      await request(app)
        .post('/staff/staff/documents/presign')
        .send(documentBody)
    ).status,
  ).toBe(500);
  expect(db.staffDocument.create).not.toHaveBeenCalled();
});
it.each(['PENDING', 'REJECTED', 'incomplete', 'suspended', 'deleted'])(
  'blocks work actions for %s staff independently of mobile gating',
  async status => {
    profile.verificationStatus =
      status === 'PENDING' || status === 'REJECTED' ? status : 'VERIFIED';
    if (status !== 'incomplete') profile.profileCompletedAt = new Date();
    if (status === 'suspended') profile.user.status = 'SUSPENDED';
    if (status === 'deleted') profile.user.deletedAt = new Date();
    for (const action of ['en-route', 'check-in', 'check-out', 'complete'])
      expect(
        (await request(app).patch(`/visits/${serviceId}/${action}`).send({}))
          .status,
      ).toBe(403);
    expect((await request(app).post('/reports').send({})).status).toBe(403);
    expect(
      (await request(app).patch(`/reports/${serviceId}`).send({})).status,
    ).toBe(403);
    expect(
      (await request(app).post(`/reports/${serviceId}/files/confirm`).send({}))
        .status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/bookings/${serviceId}/doctor-accept`)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch(`/bookings/${serviceId}/doctor-propose-time`)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (await request(app).post(`/reports/${serviceId}/files/presign`).send({}))
        .status,
    ).toBe(403);
    expect((await request(app).patch('/staff/staff/availability')).status).toBe(
      403,
    );
  },
);
it('allows verified completed staff and admin to reach existing work authorization', async () => {
  profile.verificationStatus = 'VERIFIED';
  profile.profileCompletedAt = new Date();
  expect(
    (await request(app).patch(`/visits/${serviceId}/en-route`)).status,
  ).toBe(404);
  expect(
    (
      await request(app)
        .patch(`/visits/${serviceId}/en-route`)
        .set('x-role', 'ADMIN')
    ).status,
  ).toBe(404);
});
