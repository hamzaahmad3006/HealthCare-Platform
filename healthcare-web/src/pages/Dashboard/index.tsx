import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../component/common/ProtectedRoute';
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

const adminGate = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>
    <ProtectedRoute roles={['ADMIN']}>{element}</ProtectedRoute>
  </Suspense>
);

const staffOrAdminGate = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>
    <ProtectedRoute roles={['ADMIN', 'STAFF']}>{element}</ProtectedRoute>
  </Suspense>
);

export const dashboardRoutes: RouteObject[] = [
  { path: '/admin', element: adminGate(<AdminDashboard />) },
  { path: '/admin/bookings', element: adminGate(<Bookings />) },
  { path: '/admin/bookings/:id', element: adminGate(<AdminBookingDetail />) },
  { path: '/admin/staff', element: adminGate(<Staff />) },
  { path: '/admin/staff/:userId', element: adminGate(<StaffDetail />) },
  { path: '/admin/visits', element: staffOrAdminGate(<Visits />) },
  { path: '/admin/reports', element: adminGate(<Reports />) },
  { path: '/admin/reviews', element: adminGate(<Reviews />) },
];
