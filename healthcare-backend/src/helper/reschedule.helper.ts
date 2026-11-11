import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AccessUser } from './bookingAccess.helper';
import { generateVisitSchedule } from './booking.helper';
import { renderTemplate } from './template.helper';
import { ForbiddenError, NotFoundError, ConflictError, assertBookingTransition } from '../utils/stateMachine';

interface RescheduleVisit {
  status: string;
  checkInAt?: Date | null;
  checkOutAt?: Date | null;
  beforeConditionText?: string | null;
  afterConditionText?: string | null;
  visitNotes?: string | null;
  _count?: { reports: number; reviews: number };
}

export function canRescheduleBooking(booking: {
  status: string;
  visits: RescheduleVisit[];
  _count?: { reports: number };
}): boolean {
  return ['CONFIRMED', 'ASSIGNED'].includes(booking.status)
    && !booking._count?.reports
    && booking.visits.every(v => ['SCHEDULED', 'ASSIGNED', 'CANCELLED'].includes(v.status)
      && !v.checkInAt && !v.checkOutAt && !v.beforeConditionText && !v.afterConditionText && !v.visitNotes
      && !v._count?.reports && !v._count?.reviews);
}

// Archive instead of deleting: assignments and notifications retain their visit
// references; replacement sequence numbers never collide with historical visits.
export async function cancelPlannedVisits(tx: Prisma.TransactionClient, bookingId: string): Promise<void> {
  const visits = await tx.bookingVisit.findMany({
    where: { bookingId, status: { in: ['SCHEDULED', 'ASSIGNED'] } }, select: { id: true },
  });
  const ids = visits.map(v => v.id);
  if (!ids.length) return;
  await tx.bookingAssignment.updateMany({
    where: { bookingId, status: { in: ['ASSIGNED', 'ACCEPTED'] } },
    data: { status: 'CANCELLED', respondedAt: new Date() },
  });
  await tx.bookingVisit.updateMany({
    where: { id: { in: ids }, status: { in: ['SCHEDULED', 'ASSIGNED'] } },
    data: { status: 'CANCELLED', assignedStaffUserId: null, cancellationReason: 'Booking schedule replaced or cancelled' },
  });
  await tx.notificationLog.updateMany({
    where: { bookingVisitId: { in: ids }, status: 'PENDING', templateCode: { in: ['STAFF_ASSIGNED', 'VISIT_REMINDER'] } },
    data: { status: 'FAILED', providerError: 'VISIT_SUPERSEDED' },
  });
}

export async function rescheduleBooking(user: AccessUser, bookingId: string, startDate: Date) {
  if (!['ADMIN', 'CUSTOMER'].includes(user.role)) throw new ForbiddenError('FORBIDDEN');
  try {
    return await prisma.$transaction(async tx => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          package: true, address: { select: { contactPhone: true } }, customer: { select: { phone: true } },
          visits: { include: { _count: { select: { reports: true, reviews: true } } } },
          _count: { select: { reports: true } },
        },
      });
      if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');
      if (user.role === 'CUSTOMER' && booking.customerUserId !== user.sub) throw new ForbiddenError('FORBIDDEN');
      assertBookingTransition(booking.status, 'RESCHEDULED');
      if (!canRescheduleBooking(booking)) throw new ConflictError('VISITS_CANNOT_BE_RESCHEDULED', 'Care has started or clinical records exist; this booking cannot be rescheduled');
      if (startDate.getTime() <= Date.now()) throw new ConflictError('START_DATE_NOT_FUTURE');

      const updated = await tx.booking.update({
        where: { id: bookingId, status: booking.status },
        data: { status: 'RESCHEDULED', requestedStartAt: startDate, confirmedAt: null, confirmedByUserId: null, proposedStartAt: null },
      });
      await cancelPlannedVisits(tx, bookingId);
      const lastSequence = Math.max(0, ...booking.visits.map(v => v.sequenceNo));
      await tx.bookingVisit.createMany({ data: generateVisitSchedule(bookingId, booking.package, startDate)
        .map(v => ({ ...v, sequenceNo: v.sequenceNo + lastSequence })) });
      const templateData = { bookingNumber: booking.bookingNumber, newDate: startDate.toISOString() };
      const notification = await tx.notificationLog.create({ data: {
        userId: booking.customerUserId, bookingId, templateCode: 'BOOKING_RESCHEDULED',
        recipient: booking.address.contactPhone ?? booking.customer.phone,
        renderedContent: renderTemplate('BOOKING_RESCHEDULED', templateData), templateData, status: 'PENDING',
      } });
      return { updated, notifLogId: notification.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2025', 'P2002'].includes(err.code)) {
      throw new ConflictError('BOOKING_CHANGED', 'The booking changed. Refresh before trying again.');
    }
    throw err;
  }
}
