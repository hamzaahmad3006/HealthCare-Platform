import type { BookingDraft } from '../types/useNewBooking.types';
import type { BookingStatus } from '../types/booking.types';

export function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function futureLocalStart(date: string, time: string, now = Date.now()): string {
  const start = new Date(`${date}T${time}:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time) ||
    !Number.isFinite(start.getTime()) ||
    localDateValue(start) !== date ||
    `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(
      2,
      '0',
    )}` !== time ||
    start.getTime() <= now
  ) {
    throw new Error('Choose a valid future date and time in your local time zone.');
  }
  return start.toISOString();
}

export function customerCanCancel(status: BookingStatus): boolean {
  return ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'PENDING_DOCTOR', 'TIME_PROPOSED'].includes(
    status,
  );
}

export function newBookingPayload(draft: BookingDraft, visitingDoctor: boolean) {
  if (
    !draft.packageId ||
    !draft.serviceTypeId ||
    !draft.patientId ||
    !draft.addressId ||
    !draft.cityId
  )
    throw new Error('Please complete all booking steps.');
  return {
    patientId: draft.patientId,
    serviceTypeId: draft.serviceTypeId,
    packageId: draft.packageId,
    addressId: draft.addressId,
    cityId: draft.cityId,
    requestedStartAt: futureLocalStart(draft.date, draft.time),
    urgencyLevel: draft.urgency,
    source: 'MOBILE',
    ...(draft.gender ? { preferredStaffGender: draft.gender } : {}),
    ...(draft.instructions.trim() ? { specialInstructions: draft.instructions.trim() } : {}),
    ...(visitingDoctor && draft.preferredDoctorUserId
      ? { preferredDoctorUserId: draft.preferredDoctorUserId }
      : {}),
  };
}
