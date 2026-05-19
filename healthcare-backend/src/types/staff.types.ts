import { Gender, VerifStatus } from '@prisma/client';

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

export interface UpdateStaffRequest {
  fullName?: string;
  email?: string;
  cityId?: string;
  zoneId?: string;
  gender?: Gender;
  experienceYears?: number;
}

export interface StaffListQuery {
  cityId?: string;
  zoneId?: string;
  serviceTypeId?: string;
  verificationStatus?: VerifStatus;
  isAvailable?: boolean;
  gender?: Gender;
  page?: number;
  limit?: number;
}

export interface StaffProfileResponse {
  userId: string;
  staffCode: string;
  cityId: string;
  zoneId: string | null;
  gender: Gender | null;
  cnic: string;
  experienceYears: number;
  verificationStatus: VerifStatus;
  verifiedAt: Date | null;
  isAvailable: boolean;
  createdAt: Date;
  user: {
    fullName: string;
    phone: string;
    email: string | null;
  };
}

export interface PresignDocumentRequest {
  documentType: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignDocumentResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export interface ConfirmDocumentRequest {
  documentType: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
}
