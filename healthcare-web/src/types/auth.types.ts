export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type StaffVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface UserProfile {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string;
  status?: UserStatus;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  // Populated only when role === 'STAFF' — used by the frontend to show
  // the pending-verification screen until admin verifies.
  staffVerificationStatus?: StaffVerificationStatus | null;
  staffProfileCompletedAt?: string | null;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
