/**
 * PII masking helpers — used in response transformers to hide sensitive
 * fields from non-admin roles. See SRS §13 (Security) — CNIC masking.
 */

export function maskCnic(cnic: string | null | undefined): string | null {
  if (!cnic) return null;
  const cleaned = cnic.replace(/[^0-9]/g, '');
  if (cleaned.length <= 4) return '****';
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  if (phone.length <= 4) return '****';
  return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
}
