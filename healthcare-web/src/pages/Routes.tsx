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

export function AppRoutes(): JSX.Element {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const isAuthenticated = !!(accessToken && user);
  const home =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/complete-profile' : '/my-bookings';

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Landing — signed-in users go to their dashboard */}
        <Route
          path="/"
          element={!isAuthenticated ? <Landing /> : <Navigate to={home} replace />}
        />

        {/* Auth section — /auth/login, /auth/register — blocked when signed in */}
        <Route
          path="auth/*"
          element={!isAuthenticated ? <Auth /> : <Navigate to={home} replace />}
        />

        {/* Staff onboarding — staff only */}
        <Route
          path="complete-profile"
          element={
            isAuthenticated && user?.role === 'STAFF' ? (
              <CompleteProfile />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        {/* Customer routes */}
        <Route
          path="book"
          element={isAuthenticated ? <BookingForm /> : <Navigate to="/auth/login" replace />}
        />
        <Route
          path="my-bookings"
          element={isAuthenticated ? <MyBookings /> : <Navigate to="/auth/login" replace />}
        />
        <Route
          path="my-bookings/:id"
          element={isAuthenticated ? <BookingDetail /> : <Navigate to="/auth/login" replace />}
        />

        {/* Admin dashboard */}
        <Route
          path="admin/*"
          element={
            isAuthenticated && user?.role === 'ADMIN' ? (
              <AdminRoutes />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        {/* Staff dashboard */}
        <Route
          path="staff/*"
          element={
            isAuthenticated && user?.role === 'STAFF' ? (
              <StaffRoutes />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
