import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../helper/jwt.helper';
import { UnauthorizedError } from '../utils/stateMachine';

export function authenticateToken(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('MISSING_TOKEN', 'Authorization header is required'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError('INVALID_TOKEN', 'Access token is invalid or expired'));
  }
}
