export type TemplateCode =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'STAFF_ASSIGNED'
  | 'VISIT_REMINDER'
  | 'STAFF_EN_ROUTE'
  | 'VISIT_COMPLETED'
  | 'REPORT_AVAILABLE'
  | 'PACKAGE_RENEWAL'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'STAFF_INVITE';

type TemplateData = Record<string, string | number | undefined>;

const TEMPLATES: Record<TemplateCode, (data: TemplateData) => string> = {
  BOOKING_RECEIVED: (d) =>
    `✅ We received your booking #${d['bookingNumber']} for ${d['serviceName']}. Our team will confirm it shortly.`,

  BOOKING_CONFIRMED: (d) =>
    `🎉 Your booking #${d['bookingNumber']} is confirmed! Scheduled for ${d['scheduledDate']}. We'll assign staff soon.`,

  STAFF_ASSIGNED: (d) =>
    `👨‍⚕️ ${d['staffName']} has been assigned to your booking #${d['bookingNumber']}. Visit scheduled: ${d['scheduledDate']}.`,

  VISIT_REMINDER: (d) =>
    `⏰ Reminder: Your home health visit is in 60 minutes. Booking #${d['bookingNumber']}. Staff: ${d['staffName']}.`,

  STAFF_EN_ROUTE: (d) =>
    `🚗 Your healthcare professional ${d['staffName']} is on the way for booking #${d['bookingNumber']}. ETA: ~${d['eta']} min.`,

  VISIT_COMPLETED: (d) =>
    `✅ Visit completed for booking #${d['bookingNumber']}. Notes: ${d['visitNotes'] ?? 'See app for details'}. Rate your experience!`,

  REPORT_AVAILABLE: (d) =>
    `📄 A new health report is available for ${d['patientName']} (booking #${d['bookingNumber']}). Log in to view.`,

  PACKAGE_RENEWAL: (d) =>
    `📅 Your ${d['packageName']} package (booking #${d['bookingNumber']}) ends in 3 days. Contact us to renew.`,

  BOOKING_CANCELLED: (d) =>
    `❌ Your booking #${d['bookingNumber']} has been cancelled. Reason: ${d['reason'] ?? 'N/A'}. Contact us if you need help.`,

  BOOKING_RESCHEDULED: (d) =>
    `📅 Your booking #${d['bookingNumber']} has been rescheduled to ${d['newDate']}. We apologise for any inconvenience.`,

  STAFF_INVITE: (d) =>
    `👋 Welcome to HomeHealth, ${d['fullName']}!\n\nYour staff account has been created.\n\n📱 Login: ${d['loginUrl']}\n👤 Phone: ${d['phone']}\n🔑 Temp password: ${d['tempPassword']}\n\nPlease change your password after first login and upload your verification documents (CNIC, certifications). Your assignments will start after admin verification.\n\n— HomeHealth Team`,
};

export function renderTemplate(code: TemplateCode, data: TemplateData): string {
  const renderer = TEMPLATES[code];
  return renderer(data);
}
