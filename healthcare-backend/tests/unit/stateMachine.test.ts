import { BookingStatus, VisitStatus } from '@prisma/client';
import {
  assertBookingTransition,
  assertVisitTransition,
  ConflictError,
} from '../../src/utils/stateMachine';

describe('Booking state machine', () => {
  describe('PENDING -> X', () => {
    it('allows transition to CONFIRMED', () => {
      expect(() => assertBookingTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)).not.toThrow();
    });

    it('allows transition to CANCELLED', () => {
      expect(() => assertBookingTransition(BookingStatus.PENDING, BookingStatus.CANCELLED)).not.toThrow();
    });

    it('rejects transition to COMPLETED', () => {
      expect(() => assertBookingTransition(BookingStatus.PENDING, BookingStatus.COMPLETED)).toThrow(
        ConflictError,
      );
    });

    it('rejects transition to ASSIGNED (must go via CONFIRMED first)', () => {
      expect(() => assertBookingTransition(BookingStatus.PENDING, BookingStatus.ASSIGNED)).toThrow(
        ConflictError,
      );
    });
  });

  describe('CONFIRMED -> X', () => {
    it('allows ASSIGNED, CANCELLED, RESCHEDULED', () => {
      expect(() => assertBookingTransition(BookingStatus.CONFIRMED, BookingStatus.ASSIGNED)).not.toThrow();
      expect(() => assertBookingTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED)).not.toThrow();
      expect(() => assertBookingTransition(BookingStatus.CONFIRMED, BookingStatus.RESCHEDULED)).not.toThrow();
    });

    it('rejects PENDING (no backwards transitions)', () => {
      expect(() => assertBookingTransition(BookingStatus.CONFIRMED, BookingStatus.PENDING)).toThrow(
        ConflictError,
      );
    });
  });

  describe('Terminal states', () => {
    it('COMPLETED has no outgoing transitions', () => {
      const targets: BookingStatus[] = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.ASSIGNED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingStatus.RESCHEDULED,
      ];
      for (const target of targets) {
        expect(() => assertBookingTransition(BookingStatus.COMPLETED, target)).toThrow(ConflictError);
      }
    });

    it('CANCELLED has no outgoing transitions', () => {
      expect(() => assertBookingTransition(BookingStatus.CANCELLED, BookingStatus.PENDING)).toThrow(
        ConflictError,
      );
      expect(() =>
        assertBookingTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED),
      ).toThrow(ConflictError);
    });
  });

  describe('Error semantics', () => {
    it('throws a ConflictError with INVALID_BOOKING_TRANSITION code', () => {
      try {
        assertBookingTransition(BookingStatus.COMPLETED, BookingStatus.PENDING);
        fail('Expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        expect((err as ConflictError).code).toBe('INVALID_BOOKING_TRANSITION');
      }
    });
  });
});

describe('Visit state machine', () => {
  it('walks the full happy path: SCHEDULED -> ASSIGNED -> EN_ROUTE -> CHECKED_IN -> COMPLETED', () => {
    expect(() => assertVisitTransition(VisitStatus.SCHEDULED, VisitStatus.ASSIGNED)).not.toThrow();
    expect(() => assertVisitTransition(VisitStatus.ASSIGNED, VisitStatus.EN_ROUTE)).not.toThrow();
    expect(() => assertVisitTransition(VisitStatus.EN_ROUTE, VisitStatus.CHECKED_IN)).not.toThrow();
    expect(() => assertVisitTransition(VisitStatus.CHECKED_IN, VisitStatus.COMPLETED)).not.toThrow();
  });

  it('cannot skip from ASSIGNED straight to COMPLETED', () => {
    expect(() => assertVisitTransition(VisitStatus.ASSIGNED, VisitStatus.COMPLETED)).toThrow(
      ConflictError,
    );
  });

  it('cannot cancel a CHECKED_IN visit (must complete)', () => {
    expect(() => assertVisitTransition(VisitStatus.CHECKED_IN, VisitStatus.CANCELLED)).toThrow(
      ConflictError,
    );
  });

  it('COMPLETED, MISSED, CANCELLED are terminal', () => {
    expect(() => assertVisitTransition(VisitStatus.COMPLETED, VisitStatus.SCHEDULED)).toThrow(
      ConflictError,
    );
    expect(() => assertVisitTransition(VisitStatus.MISSED, VisitStatus.SCHEDULED)).toThrow(
      ConflictError,
    );
    expect(() => assertVisitTransition(VisitStatus.CANCELLED, VisitStatus.SCHEDULED)).toThrow(
      ConflictError,
    );
  });
});
