import { Role } from '@prisma/client';

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUserProfile;
}

export interface AuthUserProfile {
  id: string;
  role: Role;
  fullName: string;
  phone: string;
  email: string | null;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  phone: string;
  session_id: string;
  iat: number;
  exp: number;
}
