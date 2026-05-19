import type { RouteObject } from 'react-router-dom';
import { Landing } from './Landing/Landing';
import { BookingForm } from './BookingForm/BookingForm';
import { MyBookings } from './MyBookings/MyBookings';
import { BookingDetail } from './BookingDetail/BookingDetail';
import { ProtectedRoute } from '../../component/common/ProtectedRoute';

export const frontendRoutes: RouteObject[] = [
  { path: '/', element: <Landing /> },
  { path: '/book', element: <BookingForm /> },
  {
    path: '/my-bookings',
    element: (
      <ProtectedRoute roles={['CUSTOMER', 'ADMIN']}>
        <MyBookings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/my-bookings/:id',
    element: (
      <ProtectedRoute roles={['CUSTOMER', 'ADMIN']}>
        <BookingDetail />
      </ProtectedRoute>
    ),
  },
];
