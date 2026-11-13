import { Prisma } from '@prisma/client';
import { findEligibleDoctor } from './doctorEligibility.helper';
import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError, BusinessError } from '../utils/stateMachine';

export interface AccessUser { sub: string; role: string }

// Visit assignments are authoritative; assignment history may include replaced staff.
export function bookingAccessWhere(user: AccessUser, allowDoctorRequest = true, cityId?: string): Prisma.BookingWhereInput {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'CUSTOMER') return { customerUserId: user.sub };
  if (user.role === 'STAFF') return {
    OR: [
      { visits: { some: { assignedStaffUserId: user.sub } } },
      ...(allowDoctorRequest ? [doctorRequestWhere(user.sub, cityId)] : []),
    ],
  };
  throw new ForbiddenError('FORBIDDEN');
}

export function doctorRequestWhere(userId: string, cityId?: string): Prisma.BookingWhereInput {
  return { ...(cityId ? { cityId } : {}), serviceType: { code: 'VISITING_DOCTOR', isActive: true }, preferredDoctorUserId: userId, status: { in: ['PENDING_DOCTOR', 'TIME_PROPOSED'] } };
}

export async function authorizedBookingWhere(user: AccessUser, allowDoctorRequest = true, db: Prisma.TransactionClient = prisma): Promise<Prisma.BookingWhereInput> {
  const doctor = user.role === 'STAFF' && allowDoctorRequest ? await findEligibleDoctor(db, user.sub) : null;
  return bookingAccessWhere(user, Boolean(doctor), doctor?.cityId ?? undefined);
}

export async function assertBookingAccess(user: AccessUser, bookingId: string, allowDoctorRequest = true, db: Prisma.TransactionClient = prisma): Promise<void> {
  const booking = await db.booking.findFirst({
    where: { id: bookingId, AND: [await authorizedBookingWhere(user, allowDoctorRequest, db)] },
    select: { id: true },
  });
  if (!booking) throw new ForbiddenError('FORBIDDEN');
}

// Preferred doctors may read the request schedule before assignment. Otherwise
// staff may read only their own visits, even when another visit shares a booking.
export function bookingVisitAccessWhere(user: AccessUser, allowDoctorRequest = true, cityId?: string): Prisma.BookingVisitWhereInput {
  if (user.role !== 'STAFF') return {};
  return { OR: [
    { assignedStaffUserId: user.sub },
    ...(allowDoctorRequest ? [{ booking: doctorRequestWhere(user.sub, cityId) }] : []),
  ] };
}

export async function assertReportTargetAccess(
  user: AccessUser,
  target: { bookingId: string; patientId: string; bookingVisitId?: string | null },
  db: Prisma.TransactionClient = prisma,
): Promise<void> {
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') throw new ForbiddenError('FORBIDDEN');
  await assertBookingAccess(user, target.bookingId, false, db);
  const booking = await db.booking.findUnique({ where: { id: target.bookingId }, select: { patientId: true } });
  if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');
  if (booking.patientId !== target.patientId) throw new BusinessError('REPORT_PATIENT_MISMATCH');
  if (target.bookingVisitId) {
    const visit = await db.bookingVisit.findUnique({ where: { id: target.bookingVisitId } });
    if (!visit || visit.bookingId !== target.bookingId) throw new BusinessError('REPORT_VISIT_MISMATCH');
    if (user.role === 'STAFF' && visit.assignedStaffUserId !== user.sub) throw new ForbiddenError('FORBIDDEN');
  }
}
