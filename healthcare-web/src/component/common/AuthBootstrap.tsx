import { ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAppDispatch, useAppSelector, store } from '../../redux/store';
import { setAuth, setInitialized, clearAuth, setLoading, setAccessToken } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import { PageSpinner } from './LoadingSpinner';
import type { UserProfile } from '../../types/auth.types';

interface AuthBootstrapProps {
  children: ReactNode;
}

const baseURL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000/api/v1';

// Module-level guard: React 18 StrictMode mounts the effect twice in dev. Only
// one refresh + /auth/me chain should run, and every path must end with
// isInitialized=true so the user is never stranded on the spinner.
let bootstrapStarted = false;

async function dispatchBootstrap(dispatchFn: ReturnType<typeof useAppDispatch>): Promise<void> {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  // Failsafe so a hung backend never strands the user on the spinner. 20s is
  // generous on purpose — dev Prisma transactions + Redis on Windows can take
  // 5–10s under load, and a too-tight timeout (we used 6s before) bounced
  // authenticated users to /login mid-refresh. The real success/failure paths
  // below clear this timer the moment they resolve, so this only fires if the
  // network never responds.
  const failsafeTimer = setTimeout(() => {
    if (!store.getState().auth.isInitialized) {
      dispatchFn(clearAuth());
      dispatchFn(setLoading(false));
      dispatchFn(setInitialized(true));
    }
  }, 20000);

  dispatchFn(setLoading(true));

  try {
    // Refresh first instead of GET /auth/me. A page reload wipes Redux, so the
    // access token is always missing on first paint — calling /auth/me first
    // would 401, then go through the response-interceptor refresh-and-retry
    // chain. That extra round-trip lengthens the window where the spinner
    // shows. Going straight to /auth/refresh shaves one request and makes the
    // success/failure signal unambiguous (200 = signed in, 401 = anonymous).
    const refreshResp = await axios.post<{
      success: true;
      data: { accessToken: string; expiresIn: number };
    }>(`${baseURL}${API.AUTH.REFRESH}`, {}, { withCredentials: true });

    const accessToken = refreshResp.data.data.accessToken;
    dispatchFn(setAccessToken(accessToken));

    const meResp = await api.get<{ success: true; data: UserProfile }>(API.AUTH.ME);
    dispatchFn(setAuth({ accessToken, user: meResp.data.data }));
  } catch {
    // Missing/expired/revoked cookie, or any network error — render anon.
    dispatchFn(clearAuth());
  } finally {
    clearTimeout(failsafeTimer);
    dispatchFn(setLoading(false));
    dispatchFn(setInitialized(true));
  }
}

// Runs once at app mount on EVERY route. Silently refreshes the access token
// using the httpOnly refresh cookie, then hydrates the user. The dispatchBootstrap
// helper is idempotent (module-level guard) so StrictMode double-mount is harmless.
export function AuthBootstrap({ children }: AuthBootstrapProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { isInitialized, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialized) return;
    void dispatchBootstrap(dispatch);
  }, [dispatch, isInitialized]);

  if (!isInitialized || isLoading) return <PageSpinner />;

  return <>{children}</>;
}
