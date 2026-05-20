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

// Module-level guard: React 18 StrictMode mounts the effect twice in dev. We
// only want one /auth/me + refresh chain — and we want every code path to end
// with isInitialized=true so the user is never stranded on the spinner.
let bootstrapStarted = false;

function dispatchBootstrap(dispatchFn: ReturnType<typeof useAppDispatch>): void {
  if (bootstrapStarted) return;
  bootstrapStarted = true;

  // Last-resort guarantee: 6 seconds from now, force isInitialized=true no
  // matter what is happening with the network. The user always sees the app.
  const failsafeTimer = setTimeout(() => {
    if (!store.getState().auth.isInitialized) {
      dispatchFn(clearAuth());
      dispatchFn(setLoading(false));
      dispatchFn(setInitialized(true));
    }
  }, 6000);

  dispatchFn(setLoading(true));

  void api
    .get<{ success: true; data: UserProfile }>(API.AUTH.ME)
    .then(({ data }) => {
      const token = store.getState().auth.accessToken ?? '';
      if (token) {
        dispatchFn(setAuth({ accessToken: token, user: data.data }));
      } else {
        // /auth/me succeeded but refresh didn't mint a token — treat as anon.
        dispatchFn(clearAuth());
      }
    })
    .catch(() => {
      // 401 + refresh-failed, network error, anything else — render anonymous.
      dispatchFn(clearAuth());
    })
    .finally(() => {
      clearTimeout(failsafeTimer);
      dispatchFn(setLoading(false));
      dispatchFn(setInitialized(true));
    });
}

// Runs once at app mount on EVERY route. Attempts /auth/me — the axios
// interceptor uses the httpOnly refresh cookie to mint a new access token on
// 401. The dispatchBootstrap helper is idempotent (module-level guard) so
// StrictMode double-mount is harmless, and a 6s failsafe timer guarantees
// isInitialized=true no matter what happens with the network.
export function AuthBootstrap({ children }: AuthBootstrapProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { isInitialized, isLoading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isInitialized) return;
    dispatchBootstrap(dispatch);
  }, [dispatch, isInitialized]);

  if (!isInitialized || isLoading) return <PageSpinner />;

  return <>{children}</>;
}
