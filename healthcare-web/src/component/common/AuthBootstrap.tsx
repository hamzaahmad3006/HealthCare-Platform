import { ReactNode, useEffect } from 'react';
import { useAppDispatch, useAppSelector, store } from '../../redux/store';
import { setAuth, setInitialized, clearAuth, setLoading } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import { PageSpinner } from './LoadingSpinner';
import type { UserProfile } from '../../types/auth.types';

interface AuthBootstrapProps {
  children: ReactNode;
}

// Runs once at app mount on EVERY route (public or protected). Attempts to
// fetch /auth/me — the axios interceptor will silently use the httpOnly refresh
// cookie to mint a new access token on 401. Without this, a page reload (or
// Vite HMR full-reload) leaves the user "logged out" in memory until they hit
// a ProtectedRoute. Now they stay signed in on the landing page too.
export function AuthBootstrap({ children }: AuthBootstrapProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { isInitialized, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialized) return;
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      dispatch(setLoading(true));
      try {
        // Hard timeout — axios has its own 15s default, but a stuck refresh +
        // retry chain can compound. If anything takes >8s, we'd rather render
        // the public app as anonymous than freeze the user on a spinner.
        const meRequest = api.get<{ success: true; data: UserProfile }>(API.AUTH.ME);
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AUTH_BOOTSTRAP_TIMEOUT')), 8000);
        });
        const { data } = await Promise.race([meRequest, timeout]);
        if (cancelled) return;
        const token = store.getState().auth.accessToken ?? '';
        if (token) {
          dispatch(setAuth({ accessToken: token, user: data.data }));
        } else {
          // /auth/me succeeded but no token in store — refresh path didn't run.
          // Treat as logged out so ProtectedRoute can redirect cleanly.
          dispatch(clearAuth());
        }
      } catch {
        if (cancelled) return;
        // No refresh cookie, it expired, or the timeout fired — treat as
        // anonymous. Public pages still render; protected pages bounce to /login.
        dispatch(clearAuth());
      } finally {
        if (!cancelled) {
          dispatch(setLoading(false));
          dispatch(setInitialized(true));
        }
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [dispatch, isInitialized]);

  // Block the first paint until we know whether the user is signed in, so
  // public pages don't briefly render a "logged out" state before the silent
  // refresh completes.
  if (!isInitialized || isLoading) return <PageSpinner />;

  return <>{children}</>;
}
