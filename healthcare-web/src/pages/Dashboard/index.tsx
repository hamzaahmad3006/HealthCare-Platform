import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../component/common/ProtectedRoute';
import { StaffVerificationGate } from '../../component/common/StaffVerificationGate';
import { PageSpinner } from '../../component/common/LoadingSpinner';

const AdminDashboard = lazy(() =>
  import('./AdminDashboard/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const Bookings = lazy(() => import('./Bookings/Bookings').then((m) => ({ default: m.Bookings })));
const AdminBookingDetail = lazy(() =>
  import('./BookingDetail/BookingDetail').then((m) => ({ default: m.AdminBookingDetail })),
);
const Staff = lazy(() => import('./Staff/Staff').then((m) => ({ default: m.Staff })));
const StaffDetail = lazy(() =>
  import('./StaffDetail/StaffDetail').then((m) => ({ default: m.StaffDetail })),
);
const Visits = lazy(() => import('./Visits/Visits').then((m) => ({ default: m.Visits })));
const Reports = lazy(() => import('./Reports/Reports').then((m) => ({ default: m.Reports })));
const Reviews = lazy(() => import('./Reviews/Reviews').then((m) => ({ default: m.Reviews })));
const StaffDocuments = lazy(() =>
  import('./StaffDocuments/StaffDocuments').then((m) => ({ default: m.StaffDocuments })),
);

const adminGate = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>
    <ProtectedRoute roles={['ADMIN']}>{element}</ProtectedRoute>
  </Suspense>
);

const staffGate = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>
    <ProtectedRoute roles={['STAFF']}>{element}</ProtectedRoute>
  </Suspense>
);

export const dashboardRoutes: RouteObject[] = [
  { path: '/admin', element: adminGate(<AdminDashboard />) },
  { path: '/admin/bookings', element: adminGate(<Bookings />) },
  { path: '/admin/bookings/:id', element: adminGate(<AdminBookingDetail />) },
  { path: '/admin/staff', element: adminGate(<Staff />) },
  { path: '/admin/staff/:userId', element: adminGate(<StaffDetail />) },
  { path: '/admin/visits', element: adminGate(<Visits />) },
  { path: '/admin/reports', element: adminGate(<Reports />) },
  { path: '/admin/reviews', element: adminGate(<Reviews />) },

  // STAFF portal — same Visits component, but URL reflects the role so a
  // staff user never sees `/admin/...` in their address bar. Verification
  // gate sits in front so unverified staff get the onboarding screen.
  { path: '/staff/visits', element: staffGate(<StaffVerificationGate><Visits /></StaffVerificationGate>) },

  // Documents page is deliberately OUTSIDE the verification gate — unverified
  // staff need this page to upload the documents required for verification.
  { path: '/staff/documents', element: staffGate(<StaffDocuments />) },

  // Legacy redirect for any old bookmark / link that pointed staff at the
  // admin URL. ADMIN keeps the route above; STAFF gets bounced here.
  { path: '/staff', element: <Navigate to="/staff/visits" replace /> },
];
