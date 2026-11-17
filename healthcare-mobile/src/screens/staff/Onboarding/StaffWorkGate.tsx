import { useCallback, useEffect, type ReactNode } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useStaffAccess } from './StaffAccess';
import { StaffSetup } from './StaffSetup';
import { staffCanWork } from '../../../utils/staffOnboarding';
import { STAFF_STATUS_CHANGED_EVENT } from '../../../utils/appEvents';

export function StaffWorkGate({ children }: { children: ReactNode }) {
  const access = useStaffAccess();
  const { refresh } = access;
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  // Unlock in real time: re-check on a verification push and when the app
  // returns to the foreground (e.g. after tapping the notification).
  useEffect(() => {
    const pushSub = DeviceEventEmitter.addListener(STAFF_STATUS_CHANGED_EVENT, () => {
      void refresh();
    });
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      pushSub.remove();
      appStateSub.remove();
    };
  }, [refresh]);
  if (access.error || !staffCanWork(access.profile)) return <StaffSetup />;
  return children;
}
