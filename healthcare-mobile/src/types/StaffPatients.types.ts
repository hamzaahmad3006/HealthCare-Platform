export interface StaffPatient {
  id: string;
  fullName: string;
  primaryCondition?: string;
  lastVisit?: string;
  totalVisits: number;
}
