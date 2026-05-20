import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PageSpinner } from '../../component/common/LoadingSpinner';

import { ProtectedRoute } from '../../component/common/ProtectedRoute';

const Login = lazy(() => import('./Login/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./Register/Register').then((m) => ({ default: m.Register })));
const CompleteProfile = lazy(() =>
  import('./CompleteProfile/CompleteProfile').then((m) => ({ default: m.CompleteProfile })),
);

const withSuspense = (element: JSX.Element): JSX.Element => (
  <Suspense fallback={<PageSpinner />}>{element}</Suspense>
);

export const authRoutes: RouteObject[] = [
  { path: '/login', element: withSuspense(<Login />) },
  { path: '/register', element: withSuspense(<Register />) },
  {
    path: '/complete-profile',
    element: withSuspense(
      <ProtectedRoute roles={['STAFF']}>
        <CompleteProfile />
      </ProtectedRoute>,
    ),
  },
];
