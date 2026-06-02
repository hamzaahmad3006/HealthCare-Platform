import { useState } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { login } from '../../../store/slices/authSlice';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function useLogin(navigation: LoginNavProp) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const handleLogin = async (): Promise<void> => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your phone number and password.');
      return;
    }
    const result = await dispatch(login({ phone, password }));
    if (login.rejected.match(result)) {
      Alert.alert('Login Failed', result.payload as string);
    }
  };

  const togglePassword = () => setShowPassword((v) => !v);

  return {
    // field values
    phone,
    password,
    showPassword,
    phoneFocused,
    passFocused,
    // state from redux
    loading,
    error,
    // handlers
    setPhone,
    setPassword,
    setPhoneFocused,
    setPassFocused,
    togglePassword,
    handleLogin,
  };
}
