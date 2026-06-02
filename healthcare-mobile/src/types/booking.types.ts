export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'PENDING_DOCTOR'
  | 'TIME_PROPOSED';

export interface Booking {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  serviceType: { name: string };
  package: { name: string; price: number };
  patient: { fullName: string } | null;
  requestedStartAt: string;
  urgency: string;
  createdAt: string;
}

export interface BookingDetail extends Booking {
  address: {
    street: string;
    area: string;
    city: { name: string };
    contactPhone: string;
  } | null;
  visits: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    staff: { user: { fullName: string } } | null;
  }>;
}
