import type { AuthUser } from './auth.types';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
}
