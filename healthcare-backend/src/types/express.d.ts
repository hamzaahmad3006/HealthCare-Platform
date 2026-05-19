import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  phone: string;
  session_id: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      id?: string;
    }
  }
}
