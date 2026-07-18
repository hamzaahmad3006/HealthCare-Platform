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
    DETAIL: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    // No RESCHEDULE here on purpose — PATCH /bookings/:id/reschedule is
    // adminOnly on the backend (booking.routes.ts) and this app has no ADMIN
    // role UI (RootNavigator only branches STAFF/CUSTOMER). A customer or
    // staff call would 403. If in-app rescheduling is ever needed, it has to
    // go through a customer/staff-facing endpoint the backend doesn't expose
    // yet, not this one.
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
    ME: '/staff/me',
    MY_PROFILE: '/staff/me/profile',
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
  NOTIFICATIONS: '/notifications',
};
