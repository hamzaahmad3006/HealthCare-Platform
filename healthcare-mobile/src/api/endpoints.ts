export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
  },
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    DOCTOR_REQUESTS: '/bookings?doctorRequestsOnly=true',
    DOCTOR_ACCEPT: (id: string) => `/bookings/${id}/doctor-accept`,
    DOCTOR_PROPOSE_TIME: (id: string) => `/bookings/${id}/doctor-propose-time`,
    CUSTOMER_ACCEPT_TIME: (id: string) => `/bookings/${id}/customer-accept-time`,
    CUSTOMER_DECLINE_TIME: (id: string) => `/bookings/${id}/customer-decline-time`,
    DETAIL: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    // Rescheduling is currently exposed by the web UI. This app keeps its
    // existing booking actions; the backend also permits eligible owned
    // customer bookings to use PATCH /bookings/:id/reschedule.
    VISITS: (id: string) => `/bookings/${id}/visits`,
  },
  SERVICE_TYPES: '/service-types',
  PACKAGES: '/packages',
  CITIES: '/cities',
  // Patients live under /users on the backend (there is no top-level /patients route).
  PATIENTS: {
    LIST: '/users/patients',
    CREATE: '/users/patients',
    DETAIL: (id: string) => `/users/patients/${id}`,
    UPDATE: (id: string) => `/users/patients/${id}`,
    DELETE: (id: string) => `/users/patients/${id}`,
  },
  ADDRESSES: {
    LIST: '/users/addresses',
    CREATE: '/users/addresses',
    UPDATE: (id: string) => `/users/addresses/${id}`,
    DELETE: (id: string) => `/users/addresses/${id}`,
  },
  STAFF: {
    DOCTORS: '/staff/doctors',
    ME: '/staff/me',
    MY_PROFILE: '/staff/me/profile',
    DOCUMENTS: (userId: string) => `/staff/${userId}/documents`,
    DOC_PRESIGN: (userId: string) => `/staff/${userId}/documents/presign`,
    DOC_CONFIRM: (userId: string) => `/staff/${userId}/documents/confirm`,
    MY_AVATAR: '/staff/me/avatar',
    AVAILABILITY: (userId: string) => `/staff/${userId}/availability`,
  },
  VISITS: {
    LIST: '/visits',
    DETAIL: (id: string) => `/visits/${id}`,
    EN_ROUTE: (id: string) => `/visits/${id}/en-route`,
    CHECK_IN: (id: string) => `/visits/${id}/check-in`,
    CHECK_OUT: (id: string) => `/visits/${id}/check-out`,
    COMPLETE: (id: string) => `/visits/${id}/complete`,
    MISS: (id: string) => `/visits/${id}/miss`,
    CANCEL: (id: string) => `/visits/${id}/cancel`,
  },
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    DETAIL: (id: string) => `/reports/${id}`,
    FILES_PRESIGN: (id: string) => `/reports/${id}/files/presign`,
    FILES_CONFIRM: (id: string) => `/reports/${id}/files/confirm`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    REGISTER_DEVICE: '/device-tokens',
    UNREGISTER_DEVICE: (id: string) => `/device-tokens/${id}`,
  },
};
