// Backend seeds fixed SNAKE_CASE service codes (see prisma/seed.ts) — API
// responses only carry the code, not a human-readable label.
export function serviceLabelFromCode(code: string): string {
  return code
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function startOfDayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function endOfDayISO(date = new Date()): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
