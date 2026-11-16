import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppSelector } from '../redux/store';
import Auth from './Auth';
import { AdminRoutes, StaffRoutes } from './Dashboard';
import { PageSpinner } from '../component/common/LoadingSpinner';
import { NotFound } from './NotFound/NotFound';

const Landing = lazy(() =>
  import('./Frontend/Landing/Landing').then((m) => ({ default: m.Landing })),
);
const BookingForm = lazy(() =>
  import('./Frontend/BookingForm/BookingForm').then((m) => ({ default: m.BookingForm })),
);
const MyBookings = lazy(() =>
  import('./Frontend/MyBookings/MyBookings').then((m) => ({ default: m.MyBookings })),
);
const BookingDetail = lazy(() =>
  import('./Frontend/BookingDetail/BookingDetail').then((m) => ({ default: m.BookingDetail })),
);
const CompleteProfile = lazy(() =>
  import('./Auth/CompleteProfile/CompleteProfile').then((m) => ({ default: m.CompleteProfile })),
);
const Account = lazy(() =>
  import('./Frontend/Account/Account').then((m) => ({ default: m.Account })),
);
const MyReports = lazy(() =>
  import('./Frontend/MyReports/MyReports').then((m) => ({ default: m.MyReports })),
);
const MyPatients = lazy(() =>
  import('./Frontend/MyPatients/MyPatients').then((m) => ({ default: m.MyPatients })),
);
const ServiceCityLanding = lazy(() =>
  import('./Frontend/SeoLanding/ServiceCityLanding').then((m) => ({
    default: m.ServiceCityLanding,
  })),
);

export function AppRoutes(): JSX.Element {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const isAuthenticated = !!(accessToken && user);
  const home =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'STAFF'
        ? user.staffProfileCompletedAt
          ? '/staff/visits'
          : '/complete-profile'
        : '/my-bookings';

  const renderCustomerElement = (element: JSX.Element): JSX.Element => {
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    if (user?.role !== 'CUSTOMER') return <Navigate to={home} replace />;
    return element;
  };

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Landing — signed-in users go to their dashboard */}
        <Route
          path="/"
          element={!isAuthenticated ? <Landing /> : <Navigate to={home} replace />}
        />

        {/* Public SEO Service & City Landing Routes */}
        <Route path="services" element={<ServiceCityLanding />} />
        <Route path="services/:serviceSlug" element={<ServiceCityLanding />} />
        <Route path="services/:serviceSlug/:citySlug" element={<ServiceCityLanding />} />
        <Route path="locations/:citySlug" element={<ServiceCityLanding />} />

        {/* Auth section — /auth/login, /auth/register — blocked when signed in */}
        <Route
          path="auth/*"
          element={!isAuthenticated ? <Auth /> : <Navigate to={home} replace />}
        />

        {/* Staff onboarding — staff only */}
        <Route
          path="complete-profile"
          element={
            !isAuthenticated ? (
              <Navigate to="/auth/login" replace />
            ) : user?.role === 'STAFF' ? (
              <CompleteProfile />
            ) : (
              <Navigate to={home} replace />
            )
          }
        />

        {/* Customer routes */}
        <Route path="book" element={renderCustomerElement(<BookingForm />)} />
        <Route path="my-bookings" element={renderCustomerElement(<MyBookings />)} />
        <Route path="my-bookings/:id" element={renderCustomerElement(<BookingDetail />)} />
        <Route path="my-account" element={renderCustomerElement(<Account />)} />
        <Route
          path="account"
          element={renderCustomerElement(<Navigate to="/my-account" replace />)}
        />
        <Route path="my-reports" element={renderCustomerElement(<MyReports />)} />
        <Route path="my-patients" element={renderCustomerElement(<MyPatients />)} />

        {/* Admin dashboard */}
        <Route
          path="admin/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/auth/login" replace />
            ) : user?.role === 'ADMIN' ? (
              <AdminRoutes />
            ) : (
              <Navigate to={home} replace />
            )
          }
        />

        {/* Staff dashboard */}
        <Route
          path="staff/*"
          element={
            !isAuthenticated ? (
              <Navigate to="/auth/login" replace />
            ) : user?.role === 'STAFF' ? (
              <StaffRoutes />
            ) : (
              <Navigate to={home} replace />
            )
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
