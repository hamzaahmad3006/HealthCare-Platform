import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/stateMachine';
import { logger } from '../utils/logger';

interface ErrorWithDetails extends AppError {
  details?: Record<string, string>[];
}

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = res.locals['requestId'] as string | undefined;

  // AppError (includes NotFoundError, ForbiddenError, ConflictError, etc.)
  if (err instanceof AppError) {
    const typed = err as ErrorWithDetails;
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: typed.details,
      },
      requestId,
    });
    return;
  }

  // Zod validation errors (if not caught by middleware)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
      requestId,
    });
    return;
  }

  // Prisma: record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'The requested resource does not exist.' },
        requestId,
      });
      return;
    }

    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ENTRY', message: 'A record with this value already exists.' },
        requestId,
      });
      return;
    }
  }

  // Unknown / unhandled errors
  logger.error('Unhandled error', {
    err,
    path: req.path,
    method: req.method,
    requestId,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
    requestId,
  });
}
