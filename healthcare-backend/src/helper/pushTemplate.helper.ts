import type { TemplateCode } from './template.helper';

// Push-notification renderer, parallel to template.helper.ts's WhatsApp renderer.
// Returns a structured {title, body} suited to a notification tray (short, no
// emoji/markdown) rather than the single WhatsApp string. TemplateCode is
// imported (single source of truth) — the Record<TemplateCode, ...> below is a
// compile-time guarantee that both renderers stay in sync: adding a code to the
// union without adding it here fails typecheck.

export interface PushContent {
  title: string;
  body: string;
}

type TemplateData = Record<string, string | number | undefined>;

const PUSH_TEMPLATES: Record<TemplateCode, (data: TemplateData) => PushContent> = {
  BOOKING_RECEIVED: (d) => ({
    title: 'Booking received',
    body: `We received your booking #${d['bookingNumber']}. We'll confirm it shortly.`,
  }),

  BOOKING_CONFIRMED: (d) => ({
    title: 'Booking confirmed',
    body: `Booking #${d['bookingNumber']} is confirmed. We'll assign staff soon.`,
  }),

  STAFF_ASSIGNED: (d) => ({
    title: 'New visit assigned',
    body: `You've been assigned to booking #${d['bookingNumber']}.`,
  }),

  VISIT_REMINDER: (d) => ({
    title: 'Visit reminder',
    body: `Your visit for booking #${d['bookingNumber']} is in about an hour.`,
  }),

  STAFF_EN_ROUTE: (d) => ({
    title: 'Your professional is on the way',
    body: `${d['staffName']} is en route for booking #${d['bookingNumber']}.`,
  }),

  VISIT_COMPLETED: (d) => ({
    title: 'Visit completed',
    body: `Your visit for booking #${d['bookingNumber']} is complete. Tap to review.`,
  }),

  REPORT_AVAILABLE: (d) => ({
    title: 'New report available',
    body: `A new health report for ${d['patientName']} is ready to view.`,
  }),

  PACKAGE_RENEWAL: (d) => ({
    title: 'Package ending soon',
    body: `Your ${d['packageName']} package ends soon. Contact us to renew.`,
  }),

  BOOKING_CANCELLED: (d) => ({
    title: 'Booking cancelled',
    body: `Booking #${d['bookingNumber']} has been cancelled.`,
  }),

  BOOKING_RESCHEDULED: (d) => ({
    title: 'Booking rescheduled',
    body: `Booking #${d['bookingNumber']} was moved to ${d['newDate']}.`,
  }),

  // Not currently push-dispatched (no NotificationLog row created), but kept so
  // the Record stays exhaustive over TemplateCode.
  STAFF_INVITE: () => ({
    title: 'Welcome to HomeHealth',
    body: 'Your staff account has been created. Open the app to get started.',
  }),

  PASSWORD_RESET: () => ({
    title: 'Password reset',
    body: 'A password reset code was requested for your account.',
  }),
};

export function renderPushContent(code: TemplateCode, data: TemplateData): PushContent {
  return PUSH_TEMPLATES[code](data);
}
