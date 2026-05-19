import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { setAuth, setInitialized, clearAuth, setLoading } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import { PageSpinner } from './LoadingSpinner';
import type { Role, UserProfile } from '../../types/auth.types';

interface ProtectedRouteProps {
  roles?: Role[];
  children: ReactNode;
}

export function ProtectedRoute({ roles, children }: ProtectedRouteProps): JSX.Element {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { accessToken, user, isInitialized, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialized) return;
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      dispatch(setLoading(true));
      try {
        // Attempt to fetch /auth/me — request interceptor will refresh on 401.
        const { data } = await api.get<{ success: true; data: UserProfile }>(API.AUTH.ME);
        if (cancelled) return;
        // If interceptor set token via refresh, /me succeeded — pull it from state.
        dispatch(setAuth({ accessToken: (window as unknown as { __tok__?: string }).__tok__ ?? '', user: data.data }));
        dispatch(setInitialized(true));
      } catch {
        if (cancelled) return;
        dispatch(clearAuth());
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch, isInitialized]);

  if (!isInitialized || isLoading) return <PageSpinner />;

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
