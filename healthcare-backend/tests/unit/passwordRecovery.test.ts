import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { ZodError } from 'zod';

jest.mock('../../src/config/database', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    passwordResetToken: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: { updateMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}));
// Delivery is mocked at the integration boundary: never send real reset messages.
jest.mock('../../src/helper/axios', () => ({ sendWhatsAppMessage: jest.fn() }));
jest.mock('../../src/helper/email.helper', () => ({ sendEmail: jest.fn() }));
jest.mock('../../src/helper/hash.helper', () => ({
  hashPassword: jest.fn(async () => 'test-password-hash'),
}));
jest.mock('../../src/helper/jwt.helper', () => ({
  generateAccessToken: () => 'test-access',
  generateRefreshToken: () => 'test-refresh',
  hashRefreshToken: () => 'test-refresh-hash',
}));
jest.mock('../../src/middleware/rateLimit.middleware', () => ({
  authLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));
import routes from '../../src/routes/auth.routes';
import { prisma } from '../../src/config/database';
import { sendWhatsAppMessage } from '../../src/helper/axios';
import { sendEmail } from '../../src/helper/email.helper';
import { AppError } from '../../src/utils/stateMachine';

const db = prisma as unknown as Record<string, Record<string, jest.Mock>>;
const phone = '+923000000000';
// Synthetic test code and password; no production credentials are used.
const otp = '000000';
const payload = { phone, otp, newPassword: 'test-only-new-password' };
let user: {
  id: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  deletedAt: Date | null;
  staffProfile?: object;
};
let token: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};
let claimed: boolean;
const app = express();
app.use(express.json());
app.use('/auth', routes);
app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) =>
  res
    .status(err instanceof ZodError ? 400 : err.statusCode ?? 500)
    .json({ error: { code: err.code } }),
);
beforeEach(() => {
  jest.clearAllMocks();
  claimed = false;
  user = {
    id: 'customer',
    phone,
    email: 'test@example.invalid',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    deletedAt: null,
  };
  token = {
    id: 'reset',
    userId: user.id,
    tokenHash: crypto.createHash('sha256').update(otp).digest('hex'),
    expiresAt: new Date(Date.now() + 60000),
    usedAt: null,
  };
  db.user.findUnique.mockImplementation(async ({ where }) =>
    where.phone === phone ? user : null,
  );
  db.passwordResetToken.findFirst.mockImplementation(async ({ where }) =>
    token.userId === where.userId &&
    token.tokenHash === where.tokenHash &&
    !token.usedAt &&
    token.expiresAt > where.expiresAt.gt
      ? token
      : null,
  );
  db.passwordResetToken.updateMany.mockImplementation(
    async ({ where, data }) => {
      if (
        where.id &&
        (claimed || token.usedAt || token.expiresAt <= where.expiresAt.gt)
      )
        return { count: 0 };
      token.usedAt = data.usedAt;
      claimed = true;
      return { count: 1 };
    },
  );
  db.passwordResetToken.create.mockResolvedValue({ id: 'new-reset' });
  db.user.update.mockResolvedValue(user);
  db.refreshToken.create.mockResolvedValue({ id: 'new-session' });
  db.refreshToken.updateMany.mockResolvedValue({ count: 1 });
  (prisma.$transaction as jest.Mock).mockImplementation(async arg =>
    typeof arg === 'function' ? arg(prisma) : Promise.all(arg),
  );
});

it('returns the same generic response for known and unknown phones and stores only a code hash', async () => {
  const known = await request(app)
    .post('/auth/forgot-password')
    .send({ phone });
  const unknown = await request(app)
    .post('/auth/forgot-password')
    .send({ phone: '+923000000001' });
  expect(known.status).toBe(200);
  expect(unknown.body).toEqual(known.body);
  expect(known.body.data).toEqual({
    message:
      'If an account with this phone exists, a reset code has been sent.',
  });
  expect(db.passwordResetToken.create.mock.calls[0][0].data).toEqual({
    userId: user.id,
    tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    expiresAt: expect.any(Date),
  });
  expect(sendWhatsAppMessage).toHaveBeenCalledTimes(1);
  expect(sendEmail).toHaveBeenCalledTimes(1);
});
it('keeps delivery failures generic', async () => {
  jest
    .mocked(sendWhatsAppMessage)
    .mockRejectedValueOnce(new Error('test transport unavailable'));
  expect(
    (await request(app).post('/auth/forgot-password').send({ phone })).status,
  ).toBe(200);
});
it.each(['wrong', 'expired', 'used', 'other-user', 'inactive', 'deleted'])(
  'rejects %s reset codes/accounts without changing credentials',
  async reason => {
    const body = { ...payload };
    if (reason === 'wrong') body.otp = '000001';
    if (reason === 'expired') token.expiresAt = new Date(0);
    if (reason === 'used') token.usedAt = new Date();
    if (reason === 'other-user') body.phone = '+923000000001';
    if (reason === 'inactive') user.status = 'SUSPENDED';
    if (reason === 'deleted') user.deletedAt = new Date();
    const res = await request(app).post('/auth/reset-password').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.refreshToken.create).not.toHaveBeenCalled();
  },
);
it.each([{ otp: 'abcdef' }, { otp: '1' }, { newPassword: 'short' }])(
  'validates reset input %p',
  async change => {
    expect(
      (
        await request(app)
          .post('/auth/reset-password')
          .send({ ...payload, ...change })
      ).status,
    ).toBe(400);
    expect(db.user.update).not.toHaveBeenCalled();
  },
);
it.each(['CUSTOMER', 'STAFF'])(
  'rotates sessions and preserves the existing %s reset response',
  async role => {
    user.role = role;
    if (role === 'STAFF')
      user.staffProfile = {
        verificationStatus: 'PENDING',
        profileCompletedAt: null,
      };
    const res = await request(app).post('/auth/reset-password').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      accessToken: 'test-access',
      refreshToken: 'test-refresh',
      user: { role },
    });
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: user.id, revokedAt: null } }),
    );
    expect(
      (await request(app).post('/auth/reset-password').send(payload)).status,
    ).toBe(400);
    expect(db.user.update).toHaveBeenCalledTimes(1);
  },
);
it('rejects a code claimed concurrently after lookup', async () => {
  db.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });
  expect(
    (await request(app).post('/auth/reset-password').send(payload)).status,
  ).toBe(400);
  expect(db.user.update).not.toHaveBeenCalled();
  expect(db.refreshToken.create).not.toHaveBeenCalled();
});
