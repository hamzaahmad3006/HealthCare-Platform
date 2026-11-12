import { api } from './client';
import { API } from './endpoints';
import { futureLocalStart } from '../utils/doctorBooking';

export function acceptDoctorRequest(id: string) {
  return api.patch(API.BOOKINGS.DOCTOR_ACCEPT(id));
}
export function proposeDoctorTime(id: string, date: string, time: string) {
  return api.patch(API.BOOKINGS.DOCTOR_PROPOSE_TIME(id), {
    proposedStartAt: futureLocalStart(date, time),
  });
}
export function respondToDoctorTime(id: string, accept: boolean) {
  return api.patch(
    accept ? API.BOOKINGS.CUSTOMER_ACCEPT_TIME(id) : API.BOOKINGS.CUSTOMER_DECLINE_TIME(id),
  );
}
