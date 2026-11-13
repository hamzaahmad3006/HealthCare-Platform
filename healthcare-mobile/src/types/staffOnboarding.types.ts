import type { StaffVerificationStatus } from './auth.types';

export interface ServiceOption {
  id: string;
  code: string;
  name: string;
}
export interface CityOption {
  id: string;
  name: string;
  zones: { id: string; name: string }[];
}
export interface StaffOnboardingProfile {
  userId: string;
  staffCode: string;
  verificationStatus: StaffVerificationStatus;
  profileCompletedAt: string | null;
  cityId: string | null;
  zoneId: string | null;
  cnic: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dateOfBirth: string | null;
  experienceYears: number;
  ambulanceNumber: string | null;
  serviceTypes: { serviceType: ServiceOption }[];
}
export interface StaffProfileDraft {
  cityId: string;
  zoneId: string;
  cnic: string;
  gender: string;
  dateOfBirth: string;
  experienceYears: string;
  ambulanceNumber: string;
  serviceTypeIds: string[];
}
export const DOCUMENT_TYPES = [
  'CNIC',
  'DEGREE',
  'LICENSE',
  'EXPERIENCE_LETTER',
  'OTHER',
] as const;
export type StaffDocumentType = (typeof DOCUMENT_TYPES)[number];
export interface StaffDocument {
  id: string;
  documentType: string;
  verificationStatus: StaffVerificationStatus;
  uploadedAt: string;
}
export interface VerificationFile {
  uri: string;
  name: string;
  type: string;
  size: number;
}
