import {
  acceptDoctorRequest,
  proposeDoctorTime,
  respondToDoctorTime,
} from '../src/api/doctorBooking';
import { api } from '../src/api/client';
import { newBookingPayload, futureLocalStart, customerCanCancel } from '../src/utils/doctorBooking';
import {
  navigateToNotification,
  flushPendingNotification,
} from '../src/utils/notificationNavigation';
import { navigationRef } from '../src/navigation/navigationRef';
import type { BookingDraft } from '../src/types/useNewBooking.types';

jest.mock('../src/api/client', () => ({ api: { patch: jest.fn() } }));
jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => true), navigate: jest.fn() },
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(navigationRef.isReady).mockReturnValue(true);
  flushPendingNotification(undefined);
});

it('uses existing doctor action endpoints and UTC payloads', () => {
  proposeDoctorTime('booking', '2035-01-02', '09:00');
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/doctor-propose-time', {
    proposedStartAt: new Date(2035, 0, 2, 9, 0).toISOString(),
  });
  acceptDoctorRequest('booking');
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/doctor-accept');
  respondToDoctorTime('booking', true);
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/customer-accept-time');
  respondToDoctorTime('booking', false);
  expect(api.patch).toHaveBeenCalledWith('/bookings/booking/customer-decline-time');
});

it('sends the selected doctor only for visiting-doctor bookings', () => {
  const draft: BookingDraft = {
    packageId: 'package',
    serviceTypeId: 'service',
    patientId: 'patient',
    addressId: 'address',
    cityId: 'city',
    date: '2035-01-02',
    time: '09:00',
    urgency: 'NORMAL',
    gender: '',
    instructions: '',
    preferredDoctorUserId: 'doctor',
    preferredDoctorName: 'Display name',
  };
  expect(newBookingPayload(draft, true)).toMatchObject({
    preferredDoctorUserId: 'doctor',
    source: 'MOBILE',
  });
  expect(newBookingPayload(draft, true)).not.toHaveProperty('preferredDoctorName');
  expect(newBookingPayload(draft, false)).not.toHaveProperty('preferredDoctorUserId');
  expect(newBookingPayload({ ...draft, preferredDoctorUserId: null }, true)).not.toHaveProperty(
    'preferredDoctorUserId',
  );
});

it.each([
  ['2035-02-30', '09:00'],
  ['2035-01-02', '25:00'],
  ['2020-01-01', '09:00'],
])('rejects invalid or past local dates: %s %s', (date, time) => {
  expect(() => futureLocalStart(date, time)).toThrow('future date and time');
  expect(() => proposeDoctorTime('booking', date, time)).toThrow();
  expect(api.patch).not.toHaveBeenCalled();
});

it('matches server cancellation eligibility in doctor and rescheduled states', () => {
  expect(customerCanCancel('PENDING_DOCTOR')).toBe(true);
  expect(customerCanCancel('TIME_PROPOSED')).toBe(true);
  expect(customerCanCancel('RESCHEDULED')).toBe(true);
  expect(customerCanCancel('COMPLETED')).toBe(false);
  expect(customerCanCancel('ASSIGNED')).toBe(false);
  expect(customerCanCancel('CANCELLED')).toBe(false);
});

it('routes doctor notifications, customer proposals and visit notifications to their actual screens', () => {
  navigateToNotification('STAFF', {
    templateCode: 'DOCTOR_BOOKING_REQUESTED',
    bookingId: 'booking',
  });
  expect(navigationRef.navigate).toHaveBeenLastCalledWith('Staff', {
    screen: 'DoctorRequests',
    params: { refreshKey: expect.any(Number) },
  });
  navigateToNotification('CUSTOMER', {
    templateCode: 'DOCTOR_TIME_PROPOSED',
    bookingId: 'booking',
  });
  expect(navigationRef.navigate).toHaveBeenLastCalledWith('Customer', {
    screen: 'BookingDetail',
    params: { id: 'booking', refreshKey: expect.any(Number) },
  });
  navigateToNotification('STAFF', {
    templateCode: 'STAFF_ASSIGNED',
    bookingId: 'booking',
    bookingVisitId: 'visit',
  });
  expect(navigationRef.navigate).toHaveBeenLastCalledWith('Staff', {
    screen: 'VisitDetail',
    params: { id: 'visit' },
  });
});

it('preserves cold-start doctor notification taps until the correct navigator is ready', () => {
  jest.mocked(navigationRef.isReady).mockReturnValue(false);
  navigateToNotification('STAFF', {
    templateCode: 'DOCTOR_BOOKING_REQUESTED',
    bookingId: 'booking',
  });
  expect(navigationRef.navigate).not.toHaveBeenCalled();
  jest.mocked(navigationRef.isReady).mockReturnValue(true);
  flushPendingNotification('STAFF');
  expect(navigationRef.navigate).toHaveBeenCalledWith('Staff', {
    screen: 'DoctorRequests',
    params: { refreshKey: expect.any(Number) },
  });
});

it('drops pending notifications when the authenticated role no longer matches', () => {
  jest.mocked(navigationRef.isReady).mockReturnValue(false);
  navigateToNotification('STAFF', {
    templateCode: 'DOCTOR_BOOKING_REQUESTED',
    bookingId: 'booking',
  });
  jest.mocked(navigationRef.isReady).mockReturnValue(true);
  flushPendingNotification('CUSTOMER');
  expect(navigationRef.navigate).not.toHaveBeenCalled();
});
