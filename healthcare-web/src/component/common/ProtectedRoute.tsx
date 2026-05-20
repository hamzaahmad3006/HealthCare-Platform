import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/store';
import type { Role } from '../../types/auth.types';

interface ProtectedRouteProps {
  roles?: Role[];
  children: ReactNode;
}

// AuthBootstrap (mounted in App.tsx) runs the silent refresh once before any
// route renders and gates the first paint behind PageSpinner. By the time this
// component sees the store, isInitialized is already true — so we just check
// whether the user is signed in and whether their role is allowed.
export function ProtectedRoute({ roles, children }: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  const { accessToken, user } = useAppSelector((s) => s.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
