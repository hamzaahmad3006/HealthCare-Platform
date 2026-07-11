import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, extractApiError, STORAGE_KEYS } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout } from '../../../store/slices/authSlice';

export interface Address {
  id: string;
  label?: string | null;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string | null;
  area: string;
}

export function useAccount() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // password fields
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    setFullName(user?.fullName ?? '');
  }, [user?.fullName]);

  const fetchAddresses = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: Address[] }>(API.ADDRESSES.LIST);
      setAddresses(data.data);
    } catch {
      // non-fatal — leave list empty
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const saveProfile = async (): Promise<void> => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch(API.USERS.ME, { fullName: fullName.trim() });
      // keep the cached user in sync
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (cached) {
        const parsed = JSON.parse(cached);
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify({ ...parsed, fullName: fullName.trim() }),
        );
      }
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setSavingProfile(false);
    }
  };

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
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      Alert.alert('Updated', 'Your password has been changed.');
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setUpdatingPwd(false);
    }
  };

  const signOut = (): void => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { dispatch(logout()); } },
    ]);
  };

  return {
    user,
    fullName, setFullName, savingProfile, saveProfile,
    oldPwd, setOldPwd, newPwd, setNewPwd, confirmPwd, setConfirmPwd,
    updatingPwd, updatePassword,
    addresses, loadingAddresses,
    signOut,
  };
}
