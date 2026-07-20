import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/store';
import { clearAuth } from '../redux/slices/authSlice';
import { api } from '../helper/axios';
import { API } from '../constant/apiUrls';
import { getWebDeviceId } from '../helper/webDeviceId';

// Shared sign-out: revokes the session and removes this browser's push token
// (best-effort), clears local auth, and navigates. Replaces the near-duplicate
// handleLogout logic previously copy-pasted in TopNav and SidebarLayout.
export function useLogout(): (redirectTo?: string) => Promise<void> {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return useCallback(
    async (redirectTo = '/'): Promise<void> => {
      try {
        await api.post(API.AUTH.LOGOUT, { deviceId: getWebDeviceId() });
      } catch {
        // ignore — local sign-out is what matters
      }
      dispatch(clearAuth());
      navigate(redirectTo, { replace: true });
    },
    [dispatch, navigate],
  );
}
