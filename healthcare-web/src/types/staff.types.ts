import type { Gender } from './booking.types';

export type VerifStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface StaffProfile {
  userId: string;
  staffCode: string;
  cityId: string;
  zoneId: string | null;
  gender: Gender | null;
  cnic: string;
  experienceYears: number;
  verificationStatus: VerifStatus;
  verifiedAt: string | null;
  isAvailable: boolean;
  createdAt: string;
  user: {
    fullName: string;
    phone: string;
    email: string | null;
  };
}

export interface StaffWithRelations extends StaffProfile {
  city: { name: string; slug: string };
  zone: { name: string; slug: string } | null;
  serviceTypes: Array<{ serviceType: { id: string; code: string; name: string } }>;
}

export interface CreateStaffRequest {
  fullName: string;
  phone: string;
  email?: string;
  cityId: string;
  zoneId?: string;
  gender?: Gender;
  cnic: string;
  dateOfBirth?: string;
  experienceYears?: number;
  serviceTypeIds: string[];
}
