import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, extractApiError, STORAGE_KEYS } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout } from '../../../store/slices/authSlice';

export function useStaffProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [available, setAvailable] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [staffCode, setStaffCode] = useState<string | null>(null);
  const [experienceYears, setExperienceYears] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const loadProfile = useCallback(async (): Promise<void> => {
    if (!user) return;
    try {
      const { data } = await api.get<{
        success: true;
        data: {
          staffCode: string;
          isAvailable: boolean;
          experienceYears: number;
          verificationStatus: string;
          city: { name: string } | null;
          zone: { name: string } | null;
        };
      }>(API.STAFF.ME);
      setStaffCode(data.data.staffCode);
      setAvailable(data.data.isAvailable);
      setExperienceYears(data.data.experienceYears);
      setVerified(data.data.verificationStatus === 'VERIFIED');
      setLocationLabel(
        [data.data.city?.name, data.data.zone?.name].filter(Boolean).join(', ') || null,
      );
    } catch {
      // Non-fatal — keeps the default local state.
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const toggleDuty = async (): Promise<void> => {
    if (!user || togglingDuty) return;
    setTogglingDuty(true);
    try {
      const { data } = await api.patch<{ success: true; data: { isAvailable: boolean } }>(
        API.STAFF.AVAILABILITY(user.id),
      );
      setAvailable(data.data.isAvailable);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setTogglingDuty(false);
    }
  };

  // password fields
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const openPasswordModal = (): void => {
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    setPasswordModalVisible(true);
  };
  const closePasswordModal = (): void => setPasswordModalVisible(false);

  const updatePassword = async (): Promise<void> => {
    if (!oldPwd || !newPwd || !confirmPwd) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Weak password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setUpdatingPwd(true);
    try {
      const { data } = await api.patch<{
        success: true;
        data: { accessToken: string; refreshToken?: string };
      }>(API.AUTH.CHANGE_PASSWORD, { oldPassword: oldPwd, newPassword: newPwd });
      // The backend rotates the token pair on password change — persist the new ones.
      const writes: [string, string][] = [[STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken]];
      if (data.data.refreshToken) writes.push([STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken]);
      await AsyncStorage.multiSet(writes);
      setPasswordModalVisible(false);
      Alert.alert('Updated', 'Your password has been changed.');
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setUpdatingPwd(false);
    }
  };

  const signOut = (): void => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { dispatch(logout()); } },
    ]);
  };

  return {
    user,
    staffCode,
    experienceYears,
    locationLabel,
    verified,
    available,
    togglingDuty,
    toggleDuty,
    passwordModalVisible,
    openPasswordModal,
    closePasswordModal,
    oldPwd, setOldPwd,
    newPwd, setNewPwd,
    confirmPwd, setConfirmPwd,
    updatingPwd,
    updatePassword,
    signOut,
  };
}
