export type VisitStatus =
  | 'SCHEDULED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED';

export interface ApiVisit {
  id: string;
  bookingId: string;
  sequenceNo: number;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  assignedStaffUserId: string | null;
  status: VisitStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  beforeConditionText: string | null;
  afterConditionText: string | null;
  visitNotes: string | null;
  cancellationReason: string | null;
  completedByStaffUserId: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    bookingNumber: string;
    customerUserId: string;
    patientId: string;
    serviceType: { code: string };
  };
}
