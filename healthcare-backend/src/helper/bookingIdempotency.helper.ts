import { createHash } from 'crypto';
import { prisma } from '../config/database';
import { ConflictError } from '../utils/stateMachine';

// Object order does not change the meaning of a JSON request. Undefined optional
// fields are omitted exactly as they are by JSON.stringify over the wire.
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export interface BookingIdempotency { scope: string; requestHash: string }

export function bookingIdempotency(scope: unknown, payload: unknown): BookingIdempotency | undefined {
  if (typeof scope !== 'string') return undefined;
  return { scope, requestHash: createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex') };
}

export async function findBookingReplay(context: BookingIdempotency) {
  const record = await prisma.bookingCreationRequest.findUnique({
    where: { id: context.scope }, include: { booking: true },
  });
  if (!record || record.expiresAt <= new Date()) return null;
  if (record.requestHash !== context.requestHash) {
    throw new ConflictError('IDEMPOTENCY_KEY_REUSED', 'This key was already used for a different booking request.');
  }
  // Return the current authorized booking; do not requeue notifications or return
  // a stale creation status after cancellation/assignment.
  return record.booking;
}
