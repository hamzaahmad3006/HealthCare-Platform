export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type StaffVerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | null;

export interface AuthUser {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  // Present for STAFF users; null/undefined for customers.
  staffVerificationStatus?: StaffVerificationStatus;
  staffProfileCompletedAt?: string | null;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}
