import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import type { AccessUser } from './bookingAccess.helper';
import { assertEligibleDoctor } from './doctorEligibility.helper';
import { cancelPlannedVisits } from './reschedule.helper';
import { generateVisitSchedule } from './booking.helper';
import { renderTemplate, TemplateCode } from './template.helper';
import { ForbiddenError, NotFoundError, ConflictError } from '../utils/stateMachine';

export type DoctorBookingAction =
  | 'doctor-accept'
  | 'doctor-propose-time'
  | 'customer-accept-time'
  | 'customer-decline-time';

export async function actOnDoctorBooking(
  user: AccessUser,
  id: string,
  action: DoctorBookingAction,
  proposedStartAt?: Date,
) {
  const doctorAction = action.startsWith('doctor-');
  if (user.role !== (doctorAction ? 'STAFF' : 'CUSTOMER')) throw new ForbiddenError('FORBIDDEN');
  try {
    return await prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id },
          include: {
            serviceType: true,
            package: true,
            customer: { select: { phone: true } },
            visits: { include: { _count: { select: { reports: true, reviews: true } } } },
            _count: { select: { reports: true } },
          },
        });
        if (!booking) throw new NotFoundError('BOOKING_NOT_FOUND');
        if (
          doctorAction
            ? booking.preferredDoctorUserId !== user.sub
            : booking.customerUserId !== user.sub
        )
          throw new ForbiddenError('FORBIDDEN');
        if (booking.serviceType.code !== 'VISITING_DOCTOR' || !booking.preferredDoctorUserId)
          throw new ConflictError('NOT_A_DOCTOR_REQUEST');
        const expected = doctorAction ? 'PENDING_DOCTOR' : 'TIME_PROPOSED';
        if (booking.status !== expected)
          throw new ConflictError(
            'WRONG_STATUS',
            'This request has changed. Refresh before trying again.',
          );
        if (action !== 'customer-decline-time')
          await assertEligibleDoctor(tx, booking.preferredDoctorUserId, booking.cityId);
        const startAt =
          action === 'doctor-propose-time'
            ? proposedStartAt
            : doctorAction
            ? booking.requestedStartAt
            : booking.proposedStartAt;
        if (
          action !== 'customer-decline-time' &&
          (!startAt || !Number.isFinite(startAt.getTime()) || startAt.getTime() <= Date.now())
        )
          throw new ConflictError('START_DATE_NOT_FUTURE', 'Choose a future date and time.');
        if (
          booking._count.reports ||
          booking.visits.some(
            (v) =>
              !['SCHEDULED', 'CANCELLED'].includes(v.status) ||
              v.assignedStaffUserId ||
              v.checkInAt ||
              v.checkOutAt ||
              v.visitNotes ||
              v.beforeConditionText ||
              v.afterConditionText ||
              v._count.reports ||
              v._count.reviews,
          )
        )
          throw new ConflictError('CLINICAL_RECORDS_EXIST');

        const decline = action === 'customer-decline-time';
        const propose = action === 'doctor-propose-time';
        const updated = await tx.booking.update({
          where: { id, status: expected },
          data: {
            status: decline ? 'CANCELLED' : propose ? 'TIME_PROPOSED' : 'PENDING',
            proposedStartAt: propose ? startAt : null,
            ...(action === 'customer-accept-time' ? { requestedStartAt: startAt! } : {}),
            ...(decline
              ? {
                  cancelledAt: new Date(),
                  cancelledByUserId: user.sub,
                  cancellationReason: 'Customer declined proposed time',
                }
              : {}),
          },
        });
        if (decline || action === 'customer-accept-time') await cancelPlannedVisits(tx, id);
        if (action === 'customer-accept-time') {
          const max = booking.visits.reduce((last, visit) => Math.max(last, visit.sequenceNo), 0);
          await tx.bookingVisit.createMany({
            data: generateVisitSchedule(id, booking.package, startAt!).map((v) => ({
              ...v,
              sequenceNo: v.sequenceNo + max,
            })),
          });
        }
        const code: TemplateCode =
          action === 'doctor-accept'
            ? 'DOCTOR_ACCEPTED'
            : propose
            ? 'DOCTOR_TIME_PROPOSED'
            : decline
            ? 'DOCTOR_TIME_DECLINED'
            : 'DOCTOR_TIME_ACCEPTED';
        const recipientId = doctorAction ? booking.customerUserId : booking.preferredDoctorUserId;
        const recipient = doctorAction
          ? booking.customer
          : await tx.user.findUniqueOrThrow({
              where: { id: recipientId },
              select: { phone: true },
            });
        const templateData = {
          bookingNumber: booking.bookingNumber,
          proposedDate: startAt?.toISOString() ?? '',
        };
        const log = await tx.notificationLog.create({
          data: {
            userId: recipientId,
            bookingId: id,
            templateCode: code,
            recipient: recipient.phone,
            renderedContent: renderTemplate(code, templateData),
            templateData,
            status: 'PENDING',
          },
        });
        return { updated, notificationIds: [log.id] };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2034', 'P2025', 'P2002'].includes(err.code)
    )
      throw new ConflictError(
        'BOOKING_CHANGED',
        'The booking changed. Refresh before trying again.',
      );
    throw err;
  }
}
