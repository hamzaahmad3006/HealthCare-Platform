import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../../component/common/ProtectedRoute';
import { PageSpinner } from '../../component/common/LoadingSpinner';

const Landing = lazy(() => import('./Landing/Landing').then((m) => ({ default: m.Landing })));
const BookingForm = lazy(() =>
  import('./BookingForm/BookingForm').then((m) => ({ default: m.BookingForm })),
);
const MyBookings = lazy(() =>
  import('./MyBookings/MyBookings').then((m) => ({ default: m.MyBookings })),
);
const BookingDetail = lazy(() =>
  import('./BookingDetail/BookingDetail').then((m) => ({ default: m.BookingDetail })),
);

const withSuspense = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>{element}</Suspense>
);

export const frontendRoutes: RouteObject[] = [
  { path: '/', element: withSuspense(<Landing />) },
  { path: '/book', element: withSuspense(<BookingForm />) },
  {
    path: '/my-bookings',
    element: withSuspense(
      <ProtectedRoute roles={['CUSTOMER', 'ADMIN']}>
        <MyBookings />
      </ProtectedRoute>,
    ),
  },
  {
    path: '/my-bookings/:id',
    element: withSuspense(
      <ProtectedRoute roles={['CUSTOMER', 'ADMIN']}>
        <BookingDetail />
      </ProtectedRoute>,
    ),
  },
];
