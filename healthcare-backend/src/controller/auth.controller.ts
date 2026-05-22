import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { verifyPassword, hashPassword } from '../helper/hash.helper';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../helper/jwt.helper';
import { success } from '../helper/response.helper';
import {
  UnauthorizedError,
  NotFoundError,
  AppError,
  ConflictError,
} from '../utils/stateMachine';
import { FAILED_LOGIN_LOCKOUT } from '../utils/constants';
import { Role } from '@prisma/client';

const lockoutKey = (phone: string): string => `login_attempts:${phone}`;

const LoginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2).max(150),
  // Accept E.164 PK numbers from the new frontend (+92 + 10 digits) and also
  // older legacy forms (03..., 923..., bare 10 digits) so existing scripts /
  // partner integrations don't break. Server normalises to +92XXXXXXXXXX.
  phone: z
    .string()
    .min(10)
    .max(20)
    .regex(/^(\+?92|0)?[0-9]{10,11}$/, 'Phone must be 10-11 digits, optional leading +92 or 0'),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, password } = LoginSchema.parse(req.body);

      // Brute-force protection — SRS §13: lock account after 10 failed attempts in 15 minutes.
      const attemptKey = lockoutKey(phone);
      const currentAttempts = Number((await redis.get(attemptKey)) ?? 0);
      if (currentAttempts >= FAILED_LOGIN_LOCKOUT.MAX_ATTEMPTS) {
        throw new AppError(
          429,
          'ACCOUNT_LOCKED',
          `Too many failed attempts. Try again in ${FAILED_LOGIN_LOCKOUT.WINDOW_MINUTES} minutes.`,
        );
      }

      const recordFailure = async (): Promise<void> => {
        const next = currentAttempts + 1;
        await redis.set(attemptKey, String(next), 'EX', FAILED_LOGIN_LOCKOUT.WINDOW_MINUTES * 60);
      };

      const user = await prisma.user.findUnique({
        where: { phone },
        include: { staffProfile: { select: { verificationStatus: true, profileCompletedAt: true } } },
      });

      if (!user || user.deletedAt) {
        await recordFailure();
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Phone or password is incorrect');
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        await recordFailure();
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Phone or password is incorrect');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('ACCOUNT_SUSPENDED', 'Your account has been suspended');
      }

      // Login succeeded — reset the failure counter.
      await redis.del(attemptKey).catch(() => null);

      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const sessionId = crypto.randomUUID();

      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

      await prisma.$transaction([
        prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
      ]);

      const accessToken = generateAccessToken({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        session_id: sessionId,
      });

      res.cookie('refresh_token', rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/',
      });

      success(res, {
        accessToken,
        expiresIn: env.JWT_ACCESS_TTL,
        user: {
          id: user.id,
          role: user.role,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          avatarUrl: user.avatarUrl,
          staffVerificationStatus: user.staffProfile?.verificationStatus ?? null,
          staffProfileCompletedAt: user.staffProfile?.profileCompletedAt ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = RegisterSchema.parse(req.body);

      // Normalise to E.164 +92XXXXXXXXXX regardless of input format.
      // Strip non-digits, drop leading 92/0, ensure exactly 10 digits, prepend.
      const stripped = data.phone.replace(/\D/g, '');
      const withoutCountry = stripped.startsWith('92') ? stripped.slice(2) : stripped;
      const local = withoutCountry.replace(/^0/, '');
      if (local.length !== 10) {
        throw new AppError(400, 'INVALID_PHONE', 'Phone must be exactly 10 digits after +92');
      }
      const phone = `+92${local}`;

      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        throw new ConflictError('PHONE_ALREADY_REGISTERED', 'An account with this phone already exists');
      }

      if (data.email) {
        const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingEmail) {
          throw new ConflictError('EMAIL_ALREADY_REGISTERED', 'An account with this email already exists');
        }
      }

      const passwordHash = await hashPassword(data.password);
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            role: Role.CUSTOMER,
            fullName: data.fullName,
            phone,
            email: data.email,
            passwordHash,
            phoneVerified: false,
            emailVerified: false,
            customerProfile: { create: {} },
          },
        });

        await tx.refreshToken.create({
          data: {
            userId: created.id,
            tokenHash,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });

        return created;
      });

      const accessToken = generateAccessToken({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        session_id: sessionId,
      });

      res.cookie('refresh_token', rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/',
      });

      success(
        res,
        {
          accessToken,
          expiresIn: env.JWT_ACCESS_TTL,
          user: {
            id: user.id,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            avatarUrl: null,
          },
        },
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies['refresh_token'] as string | undefined;
      if (!rawToken) throw new UnauthorizedError('MISSING_REFRESH_TOKEN');

      const tokenHash = hashRefreshToken(rawToken);
      const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
      }

      const user = await prisma.user.findUnique({ where: { id: stored.userId } });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('ACCOUNT_INACTIVE');
      }

      const newRawToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRawToken);
      const newExpiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);
      const sessionId = crypto.randomUUID();

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        }),
        prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: newTokenHash,
            expiresAt: newExpiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        }),
      ]);

      const accessToken = generateAccessToken({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        session_id: sessionId,
      });

      // Heal legacy cookies set at the old narrow path on prior deploys —
      // otherwise they coexist with the new root-path cookie and the server
      // picks the stale (revoked) one on the next request.
      res.clearCookie('refresh_token', { path: '/api/v1/auth' });

      // Must match login's cookie attributes EXACTLY (path + sameSite). If they
      // diverge, the browser keeps the old cookie at the old path and stores
      // the new one separately — next request sends both, server picks the
      // revoked one, user gets logged out on refresh.
      res.cookie('refresh_token', newRawToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/',
      });

      success(res, { accessToken, expiresIn: env.JWT_ACCESS_TTL });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies['refresh_token'] as string | undefined;

      if (rawToken) {
        const tokenHash = hashRefreshToken(rawToken);
        await prisma.refreshToken
          .updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
          })
          .catch(() => null);
      }

      res.clearCookie('refresh_token', { path: '/' });
      success(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: {
          id: true,
          role: true,
          fullName: true,
          phone: true,
          email: true,
          avatarUrl: true,
          status: true,
          phoneVerified: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          // Include verification + onboarding state so the frontend can gate
          // the dashboard without an extra round-trip to /staff/me.
          staffProfile: {
            select: { verificationStatus: true, profileCompletedAt: true },
          },
        },
      });

      if (!user) throw new NotFoundError('USER_NOT_FOUND');

      const { staffProfile, ...rest } = user;
      success(res, {
        ...rest,
        staffVerificationStatus: staffProfile?.verificationStatus ?? null,
        staffProfileCompletedAt: staffProfile?.profileCompletedAt ?? null,
      });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('UNAUTHENTICATED');

      const { oldPassword, newPassword } = ChangePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
      if (!user) throw new NotFoundError('USER_NOT_FOUND');

      const valid = await verifyPassword(oldPassword, user.passwordHash);
      if (!valid) throw new AppError(400, 'WRONG_PASSWORD', 'Old password is incorrect');

      const newHash = await hashPassword(newPassword);
      const rawRefreshToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(rawRefreshToken);
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL * 1000);

      // Revoke all existing sessions (other devices get logged out) then
      // issue a fresh token pair so the current session stays alive.
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } }),
        prisma.refreshToken.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
        prisma.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: newTokenHash,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        }),
      ]);

      const accessToken = generateAccessToken({
        sub: user.id,
        role: user.role,
        phone: user.phone,
        session_id: sessionId,
      });

      res.cookie('refresh_token', rawRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/',
      });

      success(res, { accessToken, expiresIn: env.JWT_ACCESS_TTL });
    } catch (err) {
      next(err);
    }
  },
};
