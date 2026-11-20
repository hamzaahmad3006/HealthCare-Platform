import { createHash } from 'crypto';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITIES: Record<string, string> = {
  users: 'USER', patients: 'PATIENT', addresses: 'ADDRESS', staff: 'STAFF',
  bookings: 'BOOKING', visits: 'VISIT', reports: 'REPORT', reviews: 'REVIEW',
  payments: 'PAYMENT', notifications: 'NOTIFICATION', auth: 'USER',
  'service-types': 'SERVICE_TYPE', packages: 'PACKAGE', cities: 'CITY', zones: 'ZONE',
  'device-tokens': 'DEVICE_TOKEN', settings: 'SETTINGS',
};

// Strict allowlist of schema keys so arbitrary/malicious client key names can never leak PHI into audit logs.
const SAFE_SCHEMA_FIELDS = new Set([
  'fullName', 'phone', 'email', 'role', 'status', 'scheduledAt', 'staffId',
  'patientId', 'addressId', 'serviceTypeId', 'packageId', 'urgency', 'rating',
  'comment', 'latitude', 'longitude', 'isAvailable', 'verificationStatus',
  'experienceYears', 'cityId', 'zoneId', 'relation', 'age', 'gender', 'label',
  'streetAddress', 'title', 'notes', 'allergies', 'password', 'oldPassword',
  'newPassword', 'otp', 'token', 'platform', 'deviceId', 'userId', 'reason',
  'proposedTime', 'fileUrl', 'fileName', 'fileType', 'summary',
]);

const SAFE_PATH_SEGMENTS = new Set([
  'api', 'v1', 'auth', 'login', 'register', 'refresh', 'logout', 'me',
  'change-password', 'forgot-password', 'reset-password', 'users', 'patients',
  'addresses', 'staff', 'convert-customer', 'doctors', 'profile', 'avatar',
  'verify', 'availability', 'services', 'documents', 'presign', 'confirm',
  'bookings', 'cancel', 'reschedule', 'assignments', 'visits', 'doctor-accept',
  'doctor-propose-time', 'customer-accept-time', 'customer-decline-time',
  'en-route', 'check-in', 'check-out', 'complete', 'miss', 'reports', 'files',
  'download', 'reviews', 'resolve', 'admin', 'dashboard', 'analytics',
  'customers', 'payments', 'staff-util', 'audit-logs', 'notifications',
  'retry', 'settings', 'service-types', 'packages', 'cities', 'zones',
  'device-tokens',
]);

// Values and arbitrary client-supplied field names can contain clinical data.
// Preserve an operation summary, never a copy of a mutation request body.
export function auditPayloadSummary(body: unknown) {
  return {
    valuesOmitted: true,
    fieldCount: body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body).length : 0,
  };
}

export function extractSafeChangedFields(body: unknown): string[] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body).filter((k) => SAFE_SCHEMA_FIELDS.has(k));
}

export function sanitizeEndpointTemplate(method: string, path: string): string {
  const parts = path.split('/').filter(Boolean);
  const normalized = parts.map((p) => {
    if (UUID.test(p)) return ':id';
    if (SAFE_PATH_SEGMENTS.has(p)) return p;
    return ':param';
  });
  return `${method.toUpperCase()} /${normalized.join('/')}`;
}

export interface AuditOperationMeta {
  actionCode: string;
  operation: string;
  category: 'CLINICAL' | 'BOOKING' | 'SECURITY' | 'STAFF' | 'PATIENT' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  endpoint: string;
  changedFields: string[];
  statusCode: number;
  hipaaRedacted: boolean;
  deviceTag: string;
  locationTag: string;
}

// Classifies User-Agent into a strict fixed enum of safe display labels.
// Never echoes raw User-Agent substrings so untrusted header content cannot leak into logs.
export function classifyDeviceTag(userAgent: string | undefined): string {
  if (!userAgent) return 'System / API Client';
  const ua = userAgent.toLowerCase();
  if (ua.includes('okhttp') || ua.includes('expo') || ua.includes('reactnative')) {
    return 'Android Mobile App';
  }
  if (ua.includes('cfnetwork') || ua.includes('darwin')) {
    return 'iOS Mobile App';
  }
  if (ua.includes('iphone') || ua.includes('ipad')) {
    return 'iPhone / iOS Safari';
  }
  if (ua.includes('android')) {
    return ua.includes('wv') ? 'Android Mobile App' : 'Android Chrome';
  }
  if (ua.includes('edg/')) {
    return ua.includes('win') ? 'Edge · Windows' : 'Edge Browser';
  }
  if (ua.includes('chrome/')) {
    if (ua.includes('win')) return 'Chrome · Windows';
    if (ua.includes('mac')) return 'Chrome · macOS';
    if (ua.includes('linux')) return 'Chrome · Linux';
    return 'Chrome Browser';
  }
  if (ua.includes('firefox/')) {
    return ua.includes('win') ? 'Firefox · Windows' : 'Firefox Browser';
  }
  if (ua.includes('safari/') && ua.includes('mac')) {
    return 'Safari · macOS';
  }
  if (ua.includes('postman') || ua.includes('curl') || ua.includes('insomnia')) {
    return 'CLI / API Tool';
  }
  return 'Web / API Client';
}

export function classifyLocationTag(ipAddress: string | undefined | null): string {
  if (!ipAddress) return 'Faisalabad HQ';
  const ip = ipAddress.trim();
  if (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('::ffff:192.168.') ||
    ip.startsWith('::ffff:10.')
  ) {
    return 'Faisalabad HQ · Local Net';
  }
  return 'Faisalabad · PK Network';
}

export function describeAuditOperation(
  method: string,
  path: string,
  entityType: string,
  body?: unknown,
  statusCode = 200,
  userAgent?: string,
  ipAddress?: string | null,
): AuditOperationMeta {
  const m = method.toUpperCase();
  const p = path.toLowerCase();
  const endpoint = sanitizeEndpointTemplate(m, path);
  const changedFields = extractSafeChangedFields(body);
  const deviceTag = classifyDeviceTag(userAgent);
  const locationTag = classifyLocationTag(ipAddress);

  let actionCode = `${entityType}_${m}`;
  let operation = `${m} ${entityType}`;
  let category: AuditOperationMeta['category'] = 'SYSTEM';
  let severity: AuditOperationMeta['severity'] = 'INFO';

  if (
    p.includes('/auth/login') ||
    m === 'LOGIN_FAILED' ||
    m === 'ACCOUNT_LOCKED' ||
    m === 'SUSPICIOUS_ACTIVITY'
  ) {
    category = 'SECURITY';
    if (m === 'SUSPICIOUS_ACTIVITY') {
      actionCode = 'SUSPICIOUS_ACTIVITY';
      operation = 'Suspicious Activity: 5+ Failed Logins Detected';
      severity = 'CRITICAL';
    } else if (m === 'ACCOUNT_LOCKED') {
      actionCode = 'ACCOUNT_LOCKED';
      operation = 'Account Locked (Brute-Force Protection)';
      severity = 'CRITICAL';
    } else if (statusCode >= 400 || m === 'LOGIN_FAILED') {
      actionCode = 'LOGIN_FAILED';
      operation = 'Failed Login Attempt (Invalid Credentials)';
      severity = 'WARNING';
    } else {
      actionCode = 'USER_LOGIN';
      operation = 'User Logged into Platform';
    }
  } else if (p.includes('/auth/register')) {
    actionCode = 'USER_REGISTERED';
    operation = 'New User Account Registered';
    category = 'SECURITY';
  } else if (p.includes('/auth/refresh')) {
    actionCode = 'SESSION_REFRESHED';
    operation = 'Auth Session Token Refreshed';
    category = 'SECURITY';
  } else if (p.includes('/auth/logout')) {
    actionCode = 'USER_LOGOUT';
    operation = 'User Signed Out';
    category = 'SECURITY';
  } else if (p.includes('/auth/change-password')) {
    actionCode = 'PASSWORD_CHANGED';
    operation = 'Account Password Changed';
    category = 'SECURITY';
    severity = 'WARNING';
  } else if (p.includes('/auth/forgot-password')) {
    actionCode = 'PASSWORD_OTP_SENT';
    operation = 'Password Recovery OTP Requested';
    category = 'SECURITY';
  } else if (p.includes('/auth/reset-password')) {
    actionCode = 'PASSWORD_RESET';
    operation = 'Password Reset via OTP';
    category = 'SECURITY';
    severity = 'WARNING';
  } else if (p.includes('/device-tokens') || entityType === 'DEVICE_TOKEN') {
    category = 'SECURITY';
    actionCode = m === 'DELETE' ? 'DEVICE_UNLINKED' : 'DEVICE_REGISTERED';
    operation = m === 'DELETE' ? 'Push Device Token Removed' : 'Push Notification Device Synced';
  } else if (p.includes('/visits/') && p.includes('/en-route')) {
    actionCode = 'VISIT_EN_ROUTE';
    operation = 'Staff Dispatched & En Route to Patient';
    category = 'CLINICAL';
  } else if (p.includes('/visits/') && p.includes('/check-in')) {
    actionCode = 'VISIT_CHECK_IN';
    operation = 'Staff Checked In at Patient Location';
    category = 'CLINICAL';
  } else if (p.includes('/visits/') && p.includes('/check-out')) {
    actionCode = 'VISIT_CHECK_OUT';
    operation = 'Staff Checked Out from Patient Visit';
    category = 'CLINICAL';
  } else if (p.includes('/visits/') && p.includes('/complete')) {
    actionCode = 'VISIT_COMPLETED';
    operation = 'Clinical Care Visit Completed';
    category = 'CLINICAL';
  } else if (p.includes('/visits/') && p.includes('/miss')) {
    actionCode = 'VISIT_MISSED';
    operation = 'Clinical Visit Marked as Missed';
    category = 'CLINICAL';
    severity = 'WARNING';
  } else if (p.includes('/visits/') && p.includes('/cancel')) {
    actionCode = 'VISIT_CANCELLED';
    operation = 'Scheduled Visit Cancelled';
    category = 'CLINICAL';
    severity = 'WARNING';
  } else if (p.includes('/bookings') && p.includes('/confirm')) {
    actionCode = 'BOOKING_CONFIRMED';
    operation = 'Care Booking Confirmed';
    category = 'BOOKING';
  } else if (p.includes('/bookings') && p.includes('/cancel')) {
    actionCode = 'BOOKING_CANCELLED';
    operation = 'Care Booking Cancelled';
    category = 'BOOKING';
    severity = 'WARNING';
  } else if (p.includes('/bookings') && p.includes('/reschedule')) {
    actionCode = 'BOOKING_RESCHEDULED';
    operation = 'Booking Schedule Updated';
    category = 'BOOKING';
  } else if (p.includes('/bookings') && p.includes('/assignments')) {
    actionCode = 'STAFF_ASSIGNED';
    operation = 'Clinical Staff Assigned to Booking';
    category = 'BOOKING';
  } else if (p.includes('/bookings') && p.includes('/doctor-accept')) {
    actionCode = 'DOCTOR_ACCEPTED';
    operation = 'Visiting Doctor Accepted Booking';
    category = 'CLINICAL';
  } else if (p.includes('/bookings') && p.includes('/doctor-propose-time')) {
    actionCode = 'DOCTOR_PROPOSED_TIME';
    operation = 'Doctor Proposed New Visit Slot';
    category = 'CLINICAL';
  } else if (p.includes('/bookings') && p.includes('/customer-accept-time')) {
    actionCode = 'TIME_ACCEPTED';
    operation = 'Customer Accepted Doctor Proposed Time';
    category = 'BOOKING';
  } else if (p.includes('/bookings') && p.includes('/customer-decline-time')) {
    actionCode = 'TIME_DECLINED';
    operation = 'Customer Declined Proposed Time';
    category = 'BOOKING';
    severity = 'WARNING';
  } else if (entityType === 'BOOKING') {
    category = 'BOOKING';
    actionCode = m === 'POST' ? 'BOOKING_CREATED' : 'BOOKING_UPDATED';
    operation = m === 'POST' ? 'New Care Booking Created' : 'Care Booking Updated';
  } else if (entityType === 'PATIENT' || p.includes('/patients')) {
    category = 'PATIENT';
    if (m === 'POST') {
      actionCode = 'PATIENT_ADDED';
      operation = 'Patient Clinical Profile Created';
    } else if (m === 'DELETE') {
      actionCode = 'PATIENT_DELETED';
      operation = 'Patient Clinical Profile Deleted';
      severity = 'CRITICAL';
    } else {
      actionCode = 'PATIENT_UPDATED';
      operation = 'Patient Clinical Record Updated';
    }
  } else if (entityType === 'ADDRESS' || p.includes('/addresses')) {
    category = 'PATIENT';
    if (m === 'POST') {
      actionCode = 'ADDRESS_ADDED';
      operation = 'Patient Service Address Added';
    } else if (m === 'DELETE') {
      actionCode = 'ADDRESS_DELETED';
      operation = 'Patient Service Address Removed';
      severity = 'WARNING';
    } else {
      actionCode = 'ADDRESS_UPDATED';
      operation = 'Patient Service Address Updated';
    }
  } else if (p.includes('/staff/convert-customer')) {
    actionCode = 'STAFF_PROMOTED';
    operation = 'Customer Promoted to Clinical Staff';
    category = 'STAFF';
    severity = 'WARNING';
  } else if (p.includes('/staff') && p.includes('/verify')) {
    actionCode = 'STAFF_VERIFIED';
    operation = 'Staff Credential Verification Updated';
    category = 'STAFF';
  } else if (p.includes('/staff') && p.includes('/availability')) {
    actionCode = 'STAFF_AVAILABILITY';
    operation = 'Staff Duty Availability Updated';
    category = 'STAFF';
  } else if (p.includes('/staff') && p.includes('/documents')) {
    actionCode = 'STAFF_DOCUMENT';
    operation = m === 'PATCH' ? 'Staff Document Reviewed by Admin' : 'Staff Credential Document Uploaded';
    category = 'STAFF';
  } else if (entityType === 'STAFF') {
    category = 'STAFF';
    actionCode = m === 'POST' ? 'STAFF_ONBOARDED' : 'STAFF_UPDATED';
    operation = m === 'POST' ? 'New Clinical Staff Registered' : 'Staff Profile Updated';
  } else if (entityType === 'REPORT' || p.includes('/reports')) {
    category = 'CLINICAL';
    if (m === 'DELETE') {
      actionCode = 'REPORT_FILE_DELETED';
      operation = 'Clinical Report Attachment Deleted';
      severity = 'CRITICAL';
    } else if (p.includes('/files')) {
      actionCode = 'REPORT_FILE_UPLOADED';
      operation = 'Clinical Report Attachment Uploaded';
    } else {
      actionCode = m === 'POST' ? 'REPORT_CREATED' : 'REPORT_UPDATED';
      operation = m === 'POST' ? 'Clinical Visit Report Filed' : 'Clinical Visit Report Updated';
    }
  } else if (entityType === 'REVIEW' || p.includes('/reviews')) {
    category = 'CLINICAL';
    actionCode = p.includes('/resolve') ? 'REVIEW_RESOLVED' : 'REVIEW_SUBMITTED';
    operation = p.includes('/resolve') ? 'Customer Feedback Resolved by Admin' : 'Customer Care Rating Submitted';
  } else if (entityType === 'VISIT') {
    category = 'CLINICAL';
    actionCode = 'VISIT_UPDATED';
    operation = 'Clinical Visit Status Updated';
  } else if (entityType === 'USER') {
    category = 'SECURITY';
    actionCode = m === 'PATCH' ? 'PROFILE_UPDATED' : 'AUTH_SESSION';
    operation = m === 'PATCH' ? 'User Account Profile Updated' : 'Authentication / Session Activity';
  }

  if (m === 'DELETE' && severity === 'INFO') {
    severity = 'WARNING';
  }

  return {
    actionCode,
    operation,
    category,
    severity,
    endpoint,
    changedFields,
    statusCode,
    hipaaRedacted: true,
    deviceTag,
    locationTag,
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

