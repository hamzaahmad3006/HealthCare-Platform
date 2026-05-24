export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

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
  createdAt: string;
  updatedAt: string;
}

export interface PatientFormData {
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
  notes?: string;
}
