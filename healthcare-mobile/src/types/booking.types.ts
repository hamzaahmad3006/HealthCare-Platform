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
  proposedStartAt: string | null;
  preferredDoctorUserId: string | null;
  urgencyLevel: string;
  // Prisma serialises Decimal as a string on some endpoints (GET /bookings/:id)
  // and as a number on others (GET /bookings) — accept both, convert at render time.
  totalPrice: string | number;
  currency: string;
  createdAt: string;
}

export interface StaffReviewSummaryItem {
  id: string;
  rating: number;
  reviewText: string | null;
  customerName: string;
  serviceName: string | null;
  bookingNumber: string | null;
  createdAt: string;
}

export interface StaffReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  recentReviews: StaffReviewSummaryItem[];
}

export interface LiveTrackingInfo {
  isActive: boolean;
  visitId: string;
  sequenceNo: number;
  status: 'EN_ROUTE' | 'CHECKED_IN';
  staffName: string;
  staffPhone: string | null;
  staffReviews?: StaffReviewSummary | null;
  staffLatitude: number;
  staffLongitude: number;
  patientLatitude: number;
  patientLongitude: number;
  originLatitude: number;
  originLongitude: number;
  distanceKm: number;
  etaMinutes: number;
  progressPercent: number;
  headingLabel: string;
  telemetrySource: 'LIVE_GPS' | 'LIVE_DISPATCH_CORRIDOR';
  lastUpdatedAt: string;
}

export interface BookingDetail extends Booking {
  activeLiveTracking?: LiveTrackingInfo | null;
  // Address has no nested city — city is a sibling field on the booking itself
  // (backend includes both `address` and `city` at the top level; see
  // booking.controller.ts's getById `include`).
  address: {
    label?: string | null;
    line1: string;
    line2?: string | null;
    area: string;
    contactName?: string;
    contactPhone: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
  } | null;
  city: { name: string } | null;
  visits: Array<{
    id: string;
    sequenceNo?: number;
    scheduledStartAt: string;
    status: string;
    assignedStaff: { user: { fullName: string; phone?: string | null } } | null;
    liveTracking?: LiveTrackingInfo | null;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    reviewText: string | null;
    createdAt: string;
  }>;
}
