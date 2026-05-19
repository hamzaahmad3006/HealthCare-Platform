import { Response } from 'express';
import { PaginationMeta } from '../types/booking.types';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>[];
  };
  requestId?: string;
}

export function success<T>(
  res: Response,
  data: T,
  status = 200,
): Response<SuccessResponse<T>> {
  return res.status(status).json({
    success: true,
    data,
    requestId: res.locals.requestId as string | undefined,
  });
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
): Response<PaginatedResponse<T>> {
  return res.status(200).json({
    success: true,
    data,
    meta,
    requestId: res.locals.requestId as string | undefined,
  });
}

export function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>[],
): Response<ErrorResponse> {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
    requestId: res.locals.requestId as string | undefined,
  });
}
