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

export type VisitStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED';

export type PackageType = 'PER_VISIT' | 'WEEKLY' | 'MONTHLY';
export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BookingSource = 'WEB' | 'MOBILE' | 'ADMIN';

export interface ServiceType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface Package {
  id: string;
  serviceTypeId: string;
  name: string;
  packageType: PackageType;
  durationDays: number;
  visitCount: number;
  priceAmount: string;
  currency: string;
  description: string | null;
  isActive: boolean;
}

export interface Patient {
  id: string;
  customerUserId: string;
  fullName: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  relationshipToCustomer: string | null;
  primaryCondition: string | null;
  allergies: string | null;
  notes: string | null;
}

export interface Address {
  id: string;
  customerUserId: string | null;
  cityId: string;
  zoneId: string | null;
  label: string | null;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2: string | null;
  area: string;
  postalCode: string | null;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface Zone {
  id: string;
  name: string;
  slug: string;
}

export interface CityWithZones extends City {
  zones: Zone[];
}

export interface Doctor {
  userId: string;
  staffCode: string;
  gender: Gender | null;
  experienceYears: number;
  city: { id: string; name: string } | null;
  user: { fullName: string; avatarUrl: string | null };
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerUserId: string;
  patientId: string;
  serviceTypeId: string;
  packageId: string;
  addressId: string;
  cityId: string;
  preferredStaffGender: Gender | null;
  preferredDoctorUserId: string | null;
  proposedStartAt: string | null;
  urgencyLevel: UrgencyLevel;
  requestedStartAt: string;
  specialInstructions: string | null;
  status: BookingStatus;
  totalPrice: string;
  currency: string;
  source: BookingSource;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingVisit {
  id: string;
  bookingId: string;
  sequenceNo: number;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  assignedStaffUserId: string | null;
  assignedStaff?: {
    user: { fullName: string; phone: string };
  } | null;
  status: VisitStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  beforeConditionText: string | null;
  afterConditionText: string | null;
  visitNotes: string | null;
  createdAt: string;
}

export interface BookingReview {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'JAZZCASH' | 'STRIPE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface BookingPayment {
  id: string;
  paymentMethod: PaymentMethod;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
}

export interface BookingWithRelations extends Booking {
  patient: Patient;
  serviceType: ServiceType;
  package: Package;
  address: Address;
  city: City;
  visits: BookingVisit[];
  reviews: BookingReview[];
  payments: BookingPayment[];
}

export interface CreateBookingRequest {
  patientId: string;
  serviceTypeId: string;
  packageId: string;
  addressId: string;
  cityId: string;
  requestedStartAt: string;
  preferredStaffGender?: Gender;
  preferredDoctorUserId?: string;
  urgencyLevel?: UrgencyLevel;
  specialInstructions?: string;
  whatsappNumber?: string;
  source?: BookingSource;
}
