import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, extractApiError, STORAGE_KEYS } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout } from '../../../store/slices/authSlice';
import type { Address, City, NewAddressInput } from '../../../types/useAccount.types';

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

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);

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

  const fetchCities = useCallback(async (): Promise<void> => {
    setCitiesLoading(true);
    setCitiesError(false);
    try {
      const { data } = await api.get<{ success: true; data: City[] }>(API.CITIES);
      setCities(data.data);
    } catch {
      // City is required to save an address — surface a retryable error state.
      setCitiesError(true);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  // Returns true on success so the screen can close its modal.
  const createAddress = async (input: NewAddressInput): Promise<boolean> => {
    if (!input.cityId) {
      Alert.alert('Required', 'Please select a city.');
      return false;
    }
    if (!input.contactName.trim() || !input.contactPhone.trim() || !input.line1.trim() || !input.area.trim()) {
      Alert.alert('Required', 'Contact name, phone, address line and area are required.');
      return false;
    }
    const payload: Record<string, unknown> = {
      cityId: input.cityId,
      contactName: input.contactName.trim(),
      contactPhone: input.contactPhone.trim(),
      line1: input.line1.trim(),
      area: input.area.trim(),
    };
    if (input.zoneId) payload.zoneId = input.zoneId;
    if (input.label.trim()) payload.label = input.label.trim();
    if (input.line2.trim()) payload.line2 = input.line2.trim();

    setAddingAddress(true);
    try {
      await api.post(API.ADDRESSES.CREATE, payload);
      await fetchAddresses();
      return true;
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      return false;
    } finally {
      setAddingAddress(false);
    }
  };

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
    cities, citiesLoading, citiesError, reloadCities: fetchCities,
    addingAddress, createAddress,
    signOut,
  };
}
