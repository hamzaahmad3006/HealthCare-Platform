import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../helper/jwt.helper';
import { UnauthorizedError } from '../utils/stateMachine';

export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const queryToken = typeof req.query?.['token'] === 'string' ? req.query['token'] : undefined;
  const cookieToken = (req as any).cookies?.['accessToken'] as string | undefined;

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (queryToken) {
    token = queryToken;
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    next(new UnauthorizedError('MISSING_TOKEN', 'Authorization token is required'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('INVALID_TOKEN', 'Access token is invalid or expired'));
  }
}
