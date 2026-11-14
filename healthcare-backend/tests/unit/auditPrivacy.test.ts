import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

jest.mock('../../src/config/database', () => ({ prisma: { auditLog: { create: jest.fn() } } }));
jest.mock('../../src/utils/logger', () => ({ logger: { error: jest.fn(), warn: jest.fn() } }));
import { prisma } from '../../src/config/database';
import { logger } from '../../src/utils/logger';
import { auditLogMiddleware } from '../../src/middleware/auditLog.middleware';
import { globalErrorHandler } from '../../src/middleware/error.middleware';
import { auditPayloadSummary, auditResource, safeRequestId } from '../../src/helper/auditPrivacy.helper';

const actor = '00000000-0000-4000-8000-000000000001';
const patient = '00000000-0000-4000-8000-000000000002';
const marker = 'SYNTHETIC-PHI-DO-NOT-LOG';
const app = express();
app.use(express.json());
app.use((req, res, next) => { res.locals['requestId'] = req.header('x-request-id'); next(); });
app.use('/api/v1', auditLogMiddleware);
// Mirrors production order: authentication populates the actor after audit setup.
app.use((req, _res, next) => { req.user = { sub: actor, role: 'ADMIN', phone: '', session_id: '', iat: 0, exp: 0 }; next(); });
app.patch('/api/v1/users/patients/:id', (_req, res) => { res.json({ success: true }); });
app.get('/api/v1/users/patients/:id', (_req, res) => { res.json({ success: true }); });
app.post('/api/v1/rejected', (_req, res) => { res.status(403).json({ success: false }); });
app.post('/api/v1/failed/:detail', (req: Request, _res: Response, next: NextFunction) => {
  next(req.header('x-prisma-error') ? new PrismaClientValidationError(marker, { clientVersion: '5.22.0' }) : new Error(marker));
});
app.use(globalErrorHandler);

beforeEach(() => { jest.clearAllMocks(); (prisma.auditLog.create as jest.Mock).mockResolvedValue({}); });

it('records successful mutations without request values, arbitrary field names or raw user agents', async () => {
  const result = await request(app).patch(`/api/v1/users/patients/${patient}`).set('User-Agent', marker).send({
    fullName: marker, notes: marker, allergies: marker, password: marker,
    nested: [{ diagnosis: marker }], [marker]: marker,
  });
  expect(result.status).toBe(200);
  const data = (prisma.auditLog.create as jest.Mock).mock.calls[0][0].data;
  expect(data).toMatchObject({ actorUserId: actor, entityType: 'PATIENT', entityId: patient, action: 'PATCH', payload: { valuesOmitted: true, fieldCount: 6 } });
  expect(data.ipAddress).toBeDefined();
  expect(data.userAgent).toMatch(/^sha256:[0-9a-f]{64}$/);
  expect(JSON.stringify(data)).not.toContain(marker);
});
it.each(['get', 'post'])('does not add successful-mutation audit rows for %s reads/rejections', async method => {
  if (method === 'get') await request(app).get(`/api/v1/users/patients/${patient}`);
  else await request(app).post('/api/v1/rejected').send({ notes: marker });
  expect(prisma.auditLog.create).not.toHaveBeenCalled();
});
it('does not leak a database failure message while reporting audit persistence failure', async () => {
  (prisma.auditLog.create as jest.Mock).mockRejectedValueOnce(new Error(marker));
  expect((await request(app).patch(`/api/v1/users/patients/${patient}`).send({ notes: marker })).status).toBe(200);
  expect(logger.error).toHaveBeenCalledWith('Audit log write failed');
  expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(marker);
});
it.each([false, true])('omits raw error content, URL parameters and untrusted request IDs from error logs (Prisma=%s)', async isPrisma => {
  const result = await request(app).post(`/api/v1/failed/${marker}`).set('X-Request-ID', marker).set('X-Prisma-Error', isPrisma ? 'yes' : '').send({ notes: marker });
  expect(result.status).toBe(isPrisma ? 400 : 500);
  const calls = [...(logger.warn as jest.Mock).mock.calls, ...(logger.error as jest.Mock).mock.calls];
  expect(calls).toHaveLength(1);
  expect(JSON.stringify(calls)).not.toContain(marker);
  expect(JSON.stringify(result.body)).not.toContain(marker);
  expect(prisma.auditLog.create).not.toHaveBeenCalled();
});
it('keeps a validated request ID for diagnostic correlation', async () => {
  const result = await request(app).post('/api/v1/failed/test').set('X-Request-ID', actor);
  expect(result.body.requestId).toBe(actor);
  expect(logger.error).toHaveBeenCalledWith('Unhandled error', { errorType: 'REQUEST_ERROR', requestId: actor });
});
it('does not echo unknown resource names or arbitrary IDs into audit metadata', () => {
  expect(auditResource(`/unknown/${marker}`)).toEqual({ entityType: 'UNKNOWN', entityId: 'unknown' });
  expect(auditResource(`/bookings/${patient}/assignments`)).toEqual({ entityType: 'BOOKING', entityId: patient });
});
it('summarizes malformed or nested input without persisting contents', () => {
  for (const body of [null, marker, [marker], undefined]) expect(auditPayloadSummary(body)).toEqual({ valuesOmitted: true, fieldCount: 0 });
});
it('accepts UUID correlation IDs and rejects arbitrary header contents', () => {
  expect(safeRequestId(actor)).toBe(actor);
  for (const input of [marker, 'req-secret', [actor], undefined]) expect(safeRequestId(input)).toBeUndefined();
});
