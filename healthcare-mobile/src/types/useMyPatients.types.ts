export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Patient {
  id: string;
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
}

export interface PatientInput {
  fullName: string;
  gender?: Gender | '';
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
}
