import { useCallback, type ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useStaffAccess } from './StaffAccess';
import { StaffSetup } from './StaffSetup';
import { staffCanWork } from '../../../utils/staffOnboarding';

export function StaffWorkGate({ children }: { children: ReactNode }) {
  const access = useStaffAccess();
  const { refresh } = access;
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  if (access.error || !staffCanWork(access.profile)) return <StaffSetup />;
  return children;
}
