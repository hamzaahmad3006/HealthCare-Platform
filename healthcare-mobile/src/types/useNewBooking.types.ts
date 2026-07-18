export type Urgency = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type Gender = '' | 'MALE' | 'FEMALE';

export interface PackageOption {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  name: string;
  packageType: string;
  durationDays: number;
  visitCount: number;
  priceAmount: string;
  currency: string;
}

export interface PatientOption {
  id: string;
  fullName: string;
  relationshipToCustomer?: string;
}

export interface AddressOption {
  id: string;
  cityId: string;
  label?: string | null;
  line1: string;
  area: string;
  contactPhone: string;
}

export interface BookingDraft {
  packageId: string | null;
  serviceTypeId: string | null;
  patientId: string | null;
  addressId: string | null;
  cityId: string | null;
  date: string;
  time: string;
  urgency: Urgency;
  gender: Gender;
  instructions: string;
}

export interface ApiServiceType { id: string; name: string; code: string }

export interface ApiPackage {
  id: string; serviceTypeId: string; name: string; packageType: string;
  durationDays: number; visitCount: number; priceAmount: string; currency: string;
}

export interface ApiPatient { id: string; fullName: string; relationshipToCustomer?: string | null }

export interface ApiAddress {
  id: string; cityId: string; label?: string | null; line1: string; area: string; contactPhone: string;
}
