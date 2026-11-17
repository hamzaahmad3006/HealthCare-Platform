import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatDate(value: string | Date | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '—';
  return format(date, pattern);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'dd MMM yyyy · h:mm a');
}

export function formatTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'h:mm a');
}

export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(amount: string | number, currency = 'PKR'): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} —`;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const clean = phone.trim();
  let digits = clean.replace(/\D/g, '');
  // Strip repeated country code prefixes if present
  while (digits.startsWith('92') && digits.length > 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('92') && digits.length === 12) {
    const local = digits.slice(2);
    return `+92 ${local.slice(0, 3)} ${local.slice(3)}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    const local = digits.slice(1);
    return `+92 ${local.slice(0, 3)} ${local.slice(3)}`;
  }
  if (digits.length === 10) {
    return `+92 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return clean;
}

export function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}
