import { createHash } from 'crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITIES: Record<string, string> = {
  users: 'USER', patients: 'PATIENT', addresses: 'ADDRESS', staff: 'STAFF',
  bookings: 'BOOKING', visits: 'VISIT', reports: 'REPORT', reviews: 'REVIEW',
  payments: 'PAYMENT', notifications: 'NOTIFICATION', auth: 'USER',
  'service-types': 'SERVICE_TYPE', packages: 'PACKAGE', cities: 'CITY', zones: 'ZONE',
};

// Values and arbitrary client-supplied field names can contain clinical data.
// Preserve an operation summary, never a copy of a mutation request body.
export function auditPayloadSummary(body: unknown) {
  return {
    valuesOmitted: true,
    fieldCount: body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body).length : 0,
  };
}

export function auditResource(path: string) {
  const parts = path.split('/').filter(Boolean);
  return {
    entityType: parts.map(part => ENTITIES[part]).filter(Boolean).at(-1) ?? 'UNKNOWN',
    entityId: parts.find(part => UUID.test(part)) ?? 'unknown',
  };
}

export function auditUserAgent(value: string | undefined): string | undefined {
  return value ? `sha256:${createHash('sha256').update(value).digest('hex')}` : undefined;
}

export function safeRequestId(value: unknown): string | undefined {
  return typeof value === 'string' && UUID.test(value) ? value : undefined;
}
