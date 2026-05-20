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
} from '../utils/stateMachine';
import { FAILED_LOGIN_LOCKOUT } from '../utils/constants';

const lockoutKey = (phone: string): string => `login_attempts:${phone}`;

const LoginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
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

      const user = await prisma.user.findUnique({ where: { phone } });

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
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/api/v1/auth',
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
        },
      });
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

      res.cookie('refresh_token', newRawToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: env.JWT_REFRESH_TTL * 1000,
        path: '/api/v1/auth',
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

      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
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
          status: true,
          phoneVerified: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) throw new NotFoundError('USER_NOT_FOUND');

      success(res, user);
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

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        }),
        prisma.refreshToken.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);

      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
      success(res, { message: 'Password changed successfully. Please log in again.' });
    } catch (err) {
      next(err);
    }
  },
};
