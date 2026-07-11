export type VisitStatus = 'SCHEDULED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TabFilter = 'TODAY' | 'UPCOMING' | 'COMPLETED';

export interface Visit {
  id: string;
  patientName: string;
  service: string;
  scheduledTime: string;
  address: string;
  status: VisitStatus;
}
