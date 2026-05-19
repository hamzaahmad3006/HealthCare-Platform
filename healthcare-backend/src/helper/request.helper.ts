import { Request } from 'express';
import { BadRequestError } from '../utils/stateMachine';

export function pickParam(req: Request, key: string): string {
  const value = req.params[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new BadRequestError('INVALID_PARAM', `Missing or invalid path parameter: ${key}`);
  }
  return value;
}

export function pickParamOptional(req: Request, key: string): string | undefined {
  const value = req.params[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function pickQuery(req: Request, key: string): string | undefined {
  const value = req.query[key];
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
}

export function pickQueryRequired(req: Request, key: string): string {
  const value = pickQuery(req, key);
  if (!value) {
    throw new BadRequestError('INVALID_QUERY', `Missing or invalid query parameter: ${key}`);
  }
  return value;
}
