import { BookingStatus, VisitStatus } from '@prisma/client';

export class ConflictError extends Error {
  public readonly statusCode = 409;
  public readonly code: string;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'ConflictError';
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message?: string) {
    super(message ?? code);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message?: string) {
    super(404, code, message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(code: string, message?: string) {
    super(403, code, message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: string, message?: string) {
    super(401, code, message);
    this.name = 'UnauthorizedError';
  }
}

export class BusinessError extends AppError {
  constructor(code: string, message?: string) {
    super(422, code, message);
    this.name = 'BusinessError';
  }
}

// ── Booking State Machine ─────────────────────────────────────────────────────

const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ASSIGNED', 'CANCELLED', 'RESCHEDULED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED', 'RESCHEDULED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  RESCHEDULED: ['CONFIRMED', 'CANCELLED'],
};

export function assertBookingTransition(
  current: BookingStatus,
  next: BookingStatus,
): void {
  const allowed = BOOKING_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new ConflictError(
      'INVALID_BOOKING_TRANSITION',
      `Cannot transition booking from ${current} to ${next}`,
    );
  }
}

// ── Visit State Machine ───────────────────────────────────────────────────────

const VISIT_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  SCHEDULED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['CHECKED_IN'],
  CHECKED_IN: ['COMPLETED'],
  COMPLETED: [],
  MISSED: [],
  CANCELLED: [],
};

export function assertVisitTransition(
  current: VisitStatus,
  next: VisitStatus,
): void {
  const allowed = VISIT_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    throw new ConflictError(
      'INVALID_VISIT_TRANSITION',
      `Cannot transition visit from ${current} to ${next}`,
    );
  }
}
