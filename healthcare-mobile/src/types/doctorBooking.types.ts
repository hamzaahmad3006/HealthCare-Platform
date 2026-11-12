export interface DoctorOption {
  userId: string;
  experienceYears: number;
  user: { fullName: string };
}
export interface DoctorRequest {
  id: string;
  bookingNumber: string;
  status: 'PENDING_DOCTOR' | 'TIME_PROPOSED';
  requestedStartAt: string;
  proposedStartAt: string | null;
  patient: { fullName: string; primaryCondition: string | null };
  package: { name: string };
  city: { name: string };
}
