import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../component/common/ProtectedRoute';
import { AdminDashboard } from './AdminDashboard/AdminDashboard';
import { Bookings } from './Bookings/Bookings';
import { AdminBookingDetail } from './BookingDetail/BookingDetail';
import { Staff } from './Staff/Staff';
import { StaffDetail } from './StaffDetail/StaffDetail';
import { Visits } from './Visits/Visits';
import { Reports } from './Reports/Reports';
import { Reviews } from './Reviews/Reviews';

const adminGate = (element: JSX.Element): JSX.Element => (
  <ProtectedRoute roles={['ADMIN']}>{element}</ProtectedRoute>
);

const staffOrAdminGate = (element: JSX.Element): JSX.Element => (
  <ProtectedRoute roles={['ADMIN', 'STAFF']}>{element}</ProtectedRoute>
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
