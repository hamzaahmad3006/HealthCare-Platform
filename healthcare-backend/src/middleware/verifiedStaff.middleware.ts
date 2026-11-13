import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError } from '../utils/stateMachine';

export async function assertVerifiedStaff(user: {
  sub: string;
  role: string;
}): Promise<void> {
  if (user.role === 'ADMIN') return;
  if (user.role !== 'STAFF') throw new ForbiddenError('STAFF_ONLY');
  const profile = await prisma.staffProfile.findFirst({
    where: {
      userId: user.sub,
      verificationStatus: 'VERIFIED',
      profileCompletedAt: { not: null },
      user: { role: 'STAFF', status: 'ACTIVE', deletedAt: null },
    },
    select: { userId: true },
  });
  if (!profile)
    throw new ForbiddenError(
      'STAFF_NOT_VERIFIED',
      'Complete your profile and wait for verification before working.',
    );
}

export async function verifiedStaff(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new ForbiddenError('UNAUTHENTICATED');
    await assertVerifiedStaff(req.user);
    next();
  } catch (err) {
    next(err);
  }
}
