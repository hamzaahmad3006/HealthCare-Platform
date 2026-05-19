import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/stateMachine';

function formatZodErrors(err: ZodError): Record<string, string>[] {
  return err.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = formatZodErrors(result.error);
      const err = new AppError(400, 'VALIDATION_ERROR', 'Request body validation failed');
      (err as AppError & { details: Record<string, string>[] }).details = details;
      next(err);
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = formatZodErrors(result.error);
      const err = new AppError(400, 'VALIDATION_ERROR', 'Query parameter validation failed');
      (err as AppError & { details: Record<string, string>[] }).details = details;
      next(err);
      return;
    }

    req.query = result.data as Record<string, string>;
    next();
  };
}
