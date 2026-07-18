export interface StaffPatient {
  id: string;
  fullName: string;
  primaryCondition?: string;
  relationshipToCustomer?: string;
}

export interface ApiStaffPatient {
  id: string;
  fullName: string;
  primaryCondition?: string | null;
  relationshipToCustomer?: string | null;
}
