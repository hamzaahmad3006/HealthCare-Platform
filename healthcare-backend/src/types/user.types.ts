import { Role, UserStatus, Gender } from '@prisma/client';

export interface UserProfile {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string;
  status: UserStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface UpdateProfileRequest {
  fullName?: string;
  email?: string;
}

export interface CreatePatientRequest {
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
  notes?: string;
  defaultAddressId?: string;
}

export interface UpdatePatientRequest {
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
  notes?: string;
  defaultAddressId?: string;
}

export interface PatientResponse {
  id: string;
  customerUserId: string;
  fullName: string;
  gender: Gender | null;
  dateOfBirth: Date | null;
  relationshipToCustomer: string | null;
  primaryCondition: string | null;
  allergies: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAddressRequest {
  cityId: string;
  zoneId?: string;
  label?: string;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  area: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAddressRequest {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  line1?: string;
  line2?: string;
  area?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface AddressResponse {
  id: string;
  customerUserId: string | null;
  cityId: string;
  zoneId: string | null;
  label: string | null;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2: string | null;
  area: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
}
