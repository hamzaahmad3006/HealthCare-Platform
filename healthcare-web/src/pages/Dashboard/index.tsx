import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageSpinner } from '../../component/common/LoadingSpinner';
import { StaffVerificationGate } from '../../component/common/StaffVerificationGate';
import { ChangePassword } from './ChangePassword/ChangePassword';

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
const Analytics = lazy(() => import('./Analytics/Analytics').then((m) => ({ default: m.Analytics })));
const Customers = lazy(() => import('./Customers/Customers').then((m) => ({ default: m.Customers })));
const Settings = lazy(() => import('./Settings/Settings').then((m) => ({ default: m.Settings })));
const AuditLogs = lazy(() => import('./AuditLogs/AuditLogs').then((m) => ({ default: m.AuditLogs })));
const CustomerDetail = lazy(() => import('./CustomerDetail/CustomerDetail').then((m) => ({ default: m.CustomerDetail })));
const PaymentHistory = lazy(() => import('./PaymentHistory/PaymentHistory').then((m) => ({ default: m.PaymentHistory })));
const StaffDocuments = lazy(() =>
  import('./StaffDocuments/StaffDocuments').then((m) => ({ default: m.StaffDocuments })),
);
const StaffProfile = lazy(() =>
  import('./StaffProfile/StaffProfile').then((m) => ({ default: m.StaffProfile })),
);
const StaffReports = lazy(() =>
  import('./StaffReports/StaffReports').then((m) => ({ default: m.StaffReports })),
);
const StaffPatients = lazy(() =>
  import('./StaffPatients/StaffPatients').then((m) => ({ default: m.StaffPatients })),
);
const DoctorRequests = lazy(() =>
  import('./DoctorRequests/DoctorRequests').then((m) => ({ default: m.DoctorRequests })),
);

// Paths here are RELATIVE to the parent route match (/admin/*).
// React Router v6 nested <Routes> strips the parent's matched prefix and
// matches only the remaining segment, so "bookings" here == /admin/bookings.
export function AdminRoutes(): JSX.Element {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<AdminBookingDetail />} />
        <Route path="staff" element={<Staff />} />
        <Route path="staff/:userId" element={<StaffDetail />} />
        <Route path="visits" element={<Visits />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="payments" element={<PaymentHistory />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Routes>
    </Suspense>
  );
}

// Paths here are RELATIVE to the parent route match (/staff/*).
export function StaffRoutes(): JSX.Element {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route
          path="visits"
          element={
            <StaffVerificationGate>
              <Visits />
            </StaffVerificationGate>
          }
        />
        <Route path="reports" element={<StaffReports />} />
        <Route path="patients" element={<StaffPatients />} />
        <Route path="documents" element={<StaffDocuments />} />
        <Route path="profile" element={<StaffProfile />} />
        <Route path="doctor-requests" element={<DoctorRequests />} />
        <Route path="change-password" element={<ChangePassword />} />
        {/* /staff with no suffix → send to visits */}
        <Route index element={<Navigate to="visits" replace />} />
      </Routes>
    </Suspense>
  );
}
