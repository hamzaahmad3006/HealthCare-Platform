export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface AuthUser {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}
