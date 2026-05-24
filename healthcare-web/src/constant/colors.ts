/**
 * Design tokens — synced 1:1 with tailwind.config.ts.
 * NEVER hardcode hex values in components. Always import from here
 * or use the Tailwind class names.
 *
 * Palette: "Fresh & Trusted" — forest green primary + sky blue accent.
 */

export const COLOR = {
  // Brand (forest green — trust, wellness, growth)
  brand: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    300: '#6EE7B7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  // Accent (sky blue — clarity, info, modern)
  accent: {
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
  },
  // Neutral ink
  ink: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Semantic
  success: { 50: '#ECFDF5', 500: '#10B981', 700: '#047857' },
  warning: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309' },
  danger: { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C' },
} as const;

/**
 * Status-to-color mapping for badges across the app.
 * Returns Tailwind class strings — never hex.
 */
export const BOOKING_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  CONFIRMED: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  ASSIGNED: 'bg-violet-50 text-violet-700 ring-violet-500/20',
  IN_PROGRESS: 'bg-sky-50 text-sky-700 ring-sky-500/20',
  COMPLETED: 'bg-success-50 text-success-700 ring-success-500/20',
  CANCELLED: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  RESCHEDULED: 'bg-amber-50 text-amber-700 ring-amber-500/20',
  PENDING_DOCTOR: 'bg-purple-50 text-purple-700 ring-purple-500/20',
  TIME_PROPOSED: 'bg-orange-50 text-orange-700 ring-orange-500/20',
};

export const VISIT_STATUS_CLASS: Record<string, string> = {
  SCHEDULED: 'bg-ink-100 text-ink-700 ring-ink-200',
  ASSIGNED: 'bg-violet-50 text-violet-700 ring-violet-500/20',
  EN_ROUTE: 'bg-sky-50 text-sky-700 ring-sky-500/20',
  CHECKED_IN: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  COMPLETED: 'bg-success-50 text-success-700 ring-success-500/20',
  MISSED: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  CANCELLED: 'bg-ink-100 text-ink-500 ring-ink-200',
};

export const VERIF_STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  VERIFIED: 'bg-success-50 text-success-700 ring-success-500/20',
  REJECTED: 'bg-danger-50 text-danger-700 ring-danger-500/20',
  EXPIRED: 'bg-ink-100 text-ink-500 ring-ink-200',
};
