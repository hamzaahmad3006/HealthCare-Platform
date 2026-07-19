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
  package: { name: string };
  patient: { id: string; fullName: string } | null;
  requestedStartAt: string;
  urgencyLevel: string;
  // Prisma serialises Decimal as a string on some endpoints (GET /bookings/:id)
  // and as a number on others (GET /bookings) — accept both, convert at render time.
  totalPrice: string | number;
  currency: string;
  createdAt: string;
}

export interface BookingDetail extends Booking {
  // Address has no nested city — city is a sibling field on the booking itself
  // (backend includes both `address` and `city` at the top level; see
  // booking.controller.ts's getById `include`).
  address: {
    line1: string;
    area: string;
    contactPhone: string;
  } | null;
  city: { name: string } | null;
  visits: Array<{
    id: string;
    scheduledStartAt: string;
    status: string;
    assignedStaff: { user: { fullName: string } } | null;
  }>;
}
