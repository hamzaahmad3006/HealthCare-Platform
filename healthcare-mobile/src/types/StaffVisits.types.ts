import type { VisitStatus } from './visit.types';

export type TabFilter = 'TODAY' | 'UPCOMING' | 'COMPLETED';

// UI-shaped visit card — derived from ApiVisit + a patientId->fullName lookup
// (the /visits list response has no patient/address expansion; see visit.types.ts).
export interface Visit {
  id: string;
  patientName: string;
  service: string;
  scheduledTime: string;
  bookingNumber: string;
  status: VisitStatus;
}
