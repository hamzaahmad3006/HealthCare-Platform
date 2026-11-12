import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppSelector } from '../../../store';
import type { StaffOnboardingProfile } from '../../../types/staffOnboarding.types';

interface StaffAccessValue {
  profile: StaffOnboardingProfile | null;
  error: string;
  loading: boolean;
  refresh: () => Promise<void>;
}
const StaffAccessContext = createContext<StaffAccessValue | null>(null);
export function StaffAccessProvider({ children }: { children: ReactNode }) {
  const userId = useAppSelector(s => s.auth.user?.id);
  const [profile, setProfile] = useState<StaffOnboardingProfile | null>(null);
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const invalidateRequests = useCallback(() => {
    sequence.current++;
  }, []);
  const refresh = useCallback(async () => {
    const token = ++sequence.current;
    setLoading(true);
    try {
      const { data } = await api.get<{ data: StaffOnboardingProfile }>(
        API.STAFF.ME,
        { headers: { 'Cache-Control': 'no-cache' } },
      );
      if (token === sequence.current) {
        setProfile(data.data);
        setError('');
      }
    } catch (err) {
      if (token === sequence.current) {
        setProfile(null);
        setError(extractApiError(err));
      }
    } finally {
      if (token === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    setProfile(null);
    if (userId) {
      void refresh();
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && userId) {
        void refresh();
      }
    });
    return () => {
      invalidateRequests();
      subscription.remove();
    };
  }, [refresh, userId, invalidateRequests]);
  return (
    <StaffAccessContext.Provider value={{ profile, error, loading, refresh }}>
      {children}
    </StaffAccessContext.Provider>
  );
}
export function useStaffAccess(): StaffAccessValue {
  const value = useContext(StaffAccessContext);
  if (!value) throw new Error('Staff access provider is missing');
  return value;
}
