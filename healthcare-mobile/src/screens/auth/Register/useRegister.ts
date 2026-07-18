import { useState } from 'react';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { register } from '../../../store/slices/authSlice';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';

type RegisterNavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function useRegister(navigation: RegisterNavProp) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (): Promise<void> => {
    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your name, phone number, and password.');
      return;
    }
    if (fullName.trim().length < 2) {
      Alert.alert('Invalid name', 'Full name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Password and confirmation do not match.');
      return;
    }

    const result = await dispatch(register({
      fullName: fullName.trim(),
      phone,
      email: email.trim() || undefined,
      password,
    }));
    if (register.rejected.match(result)) {
      Alert.alert('Registration Failed', result.payload as string);
    }
  };

  const togglePassword = () => setShowPassword((v) => !v);
  const goToLogin = () => navigation.navigate('Login');

  return {
    fullName,
    phone,
    email,
    password,
    confirmPassword,
    showPassword,
    loading,
    error,
    setFullName,
    setPhone,
    setEmail,
    setPassword,
    setConfirmPassword,
    togglePassword,
    handleRegister,
    goToLogin,
  };
}
