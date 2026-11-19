export type TemplateCode =
  | 'DOCTOR_BOOKING_REQUESTED' | 'DOCTOR_ACCEPTED' | 'DOCTOR_TIME_PROPOSED' | 'DOCTOR_TIME_ACCEPTED' | 'DOCTOR_TIME_DECLINED'
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'STAFF_ASSIGNED'
  | 'VISIT_REMINDER'
  | 'STAFF_EN_ROUTE'
  | 'STAFF_CHECKED_IN'
  | 'VISIT_COMPLETED'
  | 'FEEDBACK_REMINDER'
  | 'REPORT_AVAILABLE'
  | 'PACKAGE_RENEWAL'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'STAFF_INVITE'
  | 'STAFF_UPGRADE'
  | 'STAFF_VERIFIED'
  | 'PASSWORD_RESET';

type TemplateData = Record<string, string | number | undefined>;

const TEMPLATES: Record<TemplateCode, (data: TemplateData) => string> = {
  DOCTOR_BOOKING_REQUESTED: d => `New doctor request for booking #${d['bookingNumber']}. Open Doctor Requests to respond.`,
  DOCTOR_ACCEPTED: d => `Your doctor accepted booking #${d['bookingNumber']}. Awaiting admin confirmation.`,
  DOCTOR_TIME_PROPOSED: d => `Your doctor proposed ${d['proposedDate']} for booking #${d['bookingNumber']}. Open the booking to accept or decline.`,
  DOCTOR_TIME_ACCEPTED: d => `The customer accepted ${d['proposedDate']} for booking #${d['bookingNumber']}. Awaiting admin confirmation.`,
  DOCTOR_TIME_DECLINED: d => `The customer declined your time proposal. Booking #${d['bookingNumber']} is cancelled.`,
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

  STAFF_CHECKED_IN: (d) =>
    `🏥 ${d['staffName']} has arrived and checked in for booking #${d['bookingNumber']}. Care session is now in progress.`,

  VISIT_COMPLETED: (d) =>
    `✅ Visit completed for booking #${d['bookingNumber']}. Notes: ${d['visitNotes'] ?? 'See app for details'}. Rate your experience!`,

  FEEDBACK_REMINDER: (d) =>
    `⭐ How was your care visit with ${d['staffName']} for booking #${d['bookingNumber']}? You haven't left your feedback yet — tap to rate your staff member!`,

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

  STAFF_UPGRADE: (d) =>
    `🎉 Congratulations ${d['fullName']}!\n\nYour HomeHealth account has been upgraded to a Staff Clinician account.\n\n📱 Staff ID: ${d['staffCode']}\n👤 Phone: ${d['phone']}\n🔑 Temp password: ${d['tempPassword']}\n🌐 Portal: ${d['loginUrl']}\n\nPlease log in and complete your clinician verification profile (CNIC, experience, and deliverable services).\n\n— HomeHealth Team`,

  STAFF_VERIFIED: (d) =>
    `✅ Congratulations ${d['fullName']}! Your HomeHealth staff account has been verified. You can now go online and start receiving patient visit assignments. Login: ${d['loginUrl']}`,

  PASSWORD_RESET: (d) =>
    `🔐 *HomeHealth — Password Reset*\n\nYour one-time reset code is:\n\n*${d['otp']}*\n\nThis code expires in 15 minutes. If you did not request a password reset, please ignore this message.\n\n— HomeHealth Team`,
};

export function renderTemplate(code: TemplateCode, data: TemplateData): string {
  const renderer = TEMPLATES[code];
  return renderer(data);
}

export function renderStaffInviteEmailHtml(data: {
  fullName: string;
  phone: string;
  tempPassword: string;
  staffCode?: string;
  loginUrl: string;
}): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to HomeHealth</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Top Accent Ribbon -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #059669 0%, #10b981 50%, #6366f1 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      <span style="color: #059669;">✚</span> HomeHealth
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 12px; border-radius: 20px; border: 1px solid #a7f3d0;">
                      Staff Onboarding
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 0 36px 20px 36px;">
              <h1 style="margin: 0; font-size: 23px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Welcome to the Medical Team, ${data.fullName}! 👋
              </h1>
              <p style="margin: 12px 0 0 0; font-size: 14px; color: #475569; line-height: 1.6;">
                Your clinician staff account has been created on the HomeHealth clinical care platform. You have been assigned official credentials to access your clinician portal.
              </p>
            </td>
          </tr>

          <!-- Credentials Box -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px;">
                <div style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px;">
                  🔒 Official Login Credentials
                </div>

                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Login Phone</span><br/>
                      <span style="font-size: 14px; color: #0f172a; font-weight: 700; font-family: monospace;">${data.phone}</span>
                    </td>
                    ${
                      data.staffCode
                        ? `<td style="padding-bottom: 12px;">
                      <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Staff Code</span><br/>
                      <span style="font-size: 14px; color: #059669; font-weight: 700; font-family: monospace;">${data.staffCode}</span>
                    </td>`
                        : ''
                    }
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top: 6px;">
                      <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Temporary Password</span>
                      <div style="margin-top: 6px; background-color: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; display: inline-block;">
                        ${data.tempPassword}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 36px 28px 36px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #059669;">
                    <a href="${data.loginUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background: #059669; letter-spacing: 0.2px;">
                      Sign In to Staff Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 10px;">
                Link: <a href="${data.loginUrl}" style="color: #059669; text-decoration: underline;">${data.loginUrl}</a>
              </span>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                  3 Steps to Complete Activation:
                </h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="26" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">1</span>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>First Login:</strong> Sign in with your temporary password. You will be prompted to set a secure permanent password.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">2</span>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>Complete Profile:</strong> Enter your 13-digit CNIC, years of experience, and deliverable medical services.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" valign="top">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">3</span>
                    </td>
                    <td style="font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>Verification:</strong> Upload your PMDC/PNC license or CNIC copy. Admin verification will immediately activate your patient visit schedule.
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Security Callout -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                  🛡️ <strong>Security Notice:</strong> Please never share your credentials with anyone. HomeHealth administrators will never ask for your password.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                <strong>HomeHealth Platform</strong> — Clinical &amp; Home Healthcare Services<br/>
                Faisalabad, Pakistan • <a href="mailto:support@homehealth.pk" style="color: #059669; text-decoration: none;">support@homehealth.pk</a>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${year} HomeHealth. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderStaffUpgradeEmailHtml(data: {
  fullName: string;
  phone: string;
  tempPassword: string;
  staffCode: string;
  loginUrl: string;
}): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Upgraded to Staff — HomeHealth</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Top Accent Ribbon -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #4f46e5 0%, #059669 50%, #10b981 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      <span style="color: #059669;">✚</span> HomeHealth
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #e0e7ff; color: #3730a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 12px; border-radius: 20px; border: 1px solid #c7d2fe;">
                      Staff Promotion
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 10px 36px 24px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Congratulations, ${data.fullName}! 🎉
              </h1>
              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Your existing HomeHealth user account has been successfully upgraded to a <strong>Healthcare Staff &amp; Clinician</strong> account by our medical administration team.
              </p>
            </td>
          </tr>

          <!-- Credentials Card -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                  Staff Account Details
                </h2>

                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 35%;">Staff Code:</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">
                      ${data.staffCode}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Registered Phone:</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
                      ${data.phone}
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" style="padding: 10px 0 0 0; font-size: 13px; color: #64748b;">Temporary Password:</td>
                    <td style="padding: 10px 0 0 0;">
                      <div style="background-color: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 10px 14px; font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; display: inline-block;">
                        ${data.tempPassword}
                      </div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                        (Use this temporary password to access the staff portal on first login)
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 0 36px 28px 36px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #059669;">
                    <a href="${data.loginUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background: #059669; letter-spacing: 0.2px;">
                      Sign In &amp; Complete Clinician Profile &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <span style="display: block; font-size: 11px; color: #94a3b8; margin-top: 10px;">
                Link: <a href="${data.loginUrl}" style="color: #059669; text-decoration: underline;">${data.loginUrl}</a>
              </span>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
                  3 Quick Steps to Complete Clinician Activation:
                </h3>
                
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="26" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">1</span>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>Sign In:</strong> Log in with your temporary password and set a secure permanent password for your staff access.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" valign="top" style="padding-bottom: 10px;">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">2</span>
                    </td>
                    <td style="padding-bottom: 10px; font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>Complete Clinician Profile:</strong> Provide your 13-digit CNIC, clinical experience years, and select the services you are certified to provide.
                    </td>
                  </tr>
                  <tr>
                    <td width="26" valign="top">
                      <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background-color: #ecfdf5; color: #059669; font-weight: 800; font-size: 11px; border-radius: 50%;">3</span>
                    </td>
                    <td style="font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>License Verification:</strong> Upload your PMDC/PNC license or CNIC. Once approved by administration, patients will be assigned to you!
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Security Callout -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                  🛡️ <strong>Security Notice:</strong> Keep your staff credentials confidential. HomeHealth administration will never ask for your password.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                <strong>HomeHealth Platform</strong> — Clinical &amp; Home Healthcare Services<br/>
                Faisalabad, Pakistan • <a href="mailto:support@homehealth.pk" style="color: #059669; text-decoration: none;">support@homehealth.pk</a>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${year} HomeHealth. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderStaffVerifiedEmailHtml(data: {
  fullName: string;
  staffCode: string;
  loginUrl: string;
}): string {
  const year = new Date().getFullYear();
  const fullName = escapeHtml(data.fullName);
  const staffCode = escapeHtml(data.staffCode);
  const loginUrl = escapeHtml(data.loginUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Staff Account is Verified — HomeHealth</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 35px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #059669 0%, #10b981 100%); background-color: #059669;"></td>
          </tr>
          <tr>
            <td style="padding: 32px 36px 20px 36px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      <span style="color: #059669;">&#10010;</span> HomeHealth
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 12px; border-radius: 20px; border: 1px solid #a7f3d0;">
                      Verified
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 8px 36px 0 36px;">
              <div style="width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #ecfdf5; color: #059669; font-size: 32px; font-weight: 800; text-align: center;">&#10003;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 18px 36px 24px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                You're verified, ${fullName}!
              </h1>
              <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Our medical administration team has reviewed your profile and documents. Your HomeHealth staff account is now <strong>fully active</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; width: 40%;">Staff Code:</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace;">${staffCode}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Verification Status:</td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #047857;">Verified</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 36px 28px 36px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #059669;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; background: #059669;">
                      Open Staff Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">What happens next</h3>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">&bull; Sign in on the web portal or the HomeHealth mobile app.</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #475569; line-height: 1.5;">&bull; Set yourself <strong>Available</strong> so the team can assign patient visits to you.</p>
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">&bull; Keep notifications enabled to get instant alerts for new assignments.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                <strong>HomeHealth Platform</strong> — Clinical &amp; Home Healthcare Services<br/>
                Faisalabad, Pakistan • <a href="mailto:support@homehealth.pk" style="color: #059669; text-decoration: none;">support@homehealth.pk</a>
              </p>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #94a3b8;">&copy; ${year} HomeHealth. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
