import { Prisma } from '@prisma/client';
import { ForbiddenError } from '../utils/stateMachine';

export function eligibleDoctorWhere(
  cityId?: string,
  available = false,
): Prisma.StaffProfileWhereInput {
  return {
    verificationStatus: 'VERIFIED',
    profileCompletedAt: { not: null },
    user: { role: 'STAFF', status: 'ACTIVE', deletedAt: null },
    ...(available ? { isAvailable: true } : {}),
    ...(cityId ? { cityId } : { cityId: { not: null } }),
    serviceTypes: { some: { serviceType: { code: 'VISITING_DOCTOR', isActive: true } } },
  };
}

export async function findEligibleDoctor(
  db: Prisma.TransactionClient,
  userId: string,
  cityId?: string,
  available = false,
) {
  return db.staffProfile.findFirst({
    where: { userId, ...eligibleDoctorWhere(cityId, available) },
    select: { userId: true, cityId: true, user: { select: { phone: true } } },
  });
}

export async function assertEligibleDoctor(
  db: Prisma.TransactionClient,
  userId: string,
  cityId?: string,
  available = false,
) {
  const doctor = await findEligibleDoctor(db, userId, cityId, available);
  if (!doctor)
    throw new ForbiddenError(
      'DOCTOR_NOT_ELIGIBLE',
      'Select an eligible verified visiting doctor for this city.',
    );
  return doctor;
}
