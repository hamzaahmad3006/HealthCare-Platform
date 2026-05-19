import { BookingStatus, BookingSource, UrgencyLevel, Gender, VisitStatus } from '@prisma/client';

export interface CreateBookingRequest {
  patientId: string;
  serviceTypeId: string;
  packageId: string;
  addressId: string;
  cityId: string;
  requestedStartAt: string;
  preferredStaffGender?: Gender;
  urgencyLevel?: UrgencyLevel;
  specialInstructions?: string;
  whatsappNumber?: string;
  source?: BookingSource;
}

export interface BookingListQuery {
  status?: BookingStatus;
  cityId?: string;
  serviceTypeId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface RescheduleBookingRequest {
  requestedStartAt: string;
  reason?: string;
}

export interface AssignStaffRequest {
  visitId: string;
  staffUserId: string;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  customerUserId: string;
  patientId: string;
  serviceTypeId: string;
  packageId: string;
  addressId: string;
  cityId: string;
  preferredStaffGender: Gender | null;
  urgencyLevel: UrgencyLevel;
  requestedStartAt: Date;
  specialInstructions: string | null;
  status: BookingStatus;
  totalPrice: string;
  currency: string;
  source: BookingSource;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingWithRelations extends BookingResponse {
  patient: { fullName: string; primaryCondition: string | null };
  serviceType: { code: string; name: string };
  package: { name: string; packageType: string; visitCount: number };
  address: { line1: string; area: string; contactPhone: string };
  city: { name: string; slug: string };
  visits: VisitResponse[];
}

export interface VisitResponse {
  id: string;
  bookingId: string;
  sequenceNo: number;
  scheduledStartAt: Date;
  scheduledEndAt: Date | null;
  assignedStaffUserId: string | null;
  status: VisitStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  checkInLatitude: string | null;
  checkInLongitude: string | null;
  visitNotes: string | null;
  beforeConditionText: string | null;
  afterConditionText: string | null;
  offlineSyncId: string | null;
  createdAt: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}
