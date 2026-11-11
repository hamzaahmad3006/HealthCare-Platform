// datetime-local uses the browser's wall clock, never UTC's calendar fields.
export function localDateTimeValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function futureLocalTimeToIso(value: string, now = Date.now()): string {
  const date = new Date(value);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    || !Number.isFinite(date.getTime()) || localDateTimeValue(date) !== value || date.getTime() <= now) {
    throw new Error('Choose a valid future date and time.');
  }
  return date.toISOString();
}
