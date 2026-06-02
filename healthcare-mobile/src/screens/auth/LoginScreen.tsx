import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { login } from '../../store/slices/authSlice';
import type { LoginScreenProps } from '../../navigation/types';

export function LoginScreen(_props: LoginScreenProps): JSX.Element {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (): Promise<void> => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Required', 'Enter phone and password');
      return;
    }
    const result = await dispatch(login({ phone, password }));
    if (login.rejected.match(result)) {
      Alert.alert('Login failed', result.payload as string);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.brand}>HomeHealth</Text>
        <Text style={styles.subtitle}>Faisalabad</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.hint}>Sign in to manage your bookings and care.</Text>

        {/* Phone */}
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+92</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="3001234567"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
          />
        </View>

        {/* Password */}
        <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Your password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign in</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  brand: { fontSize: 22, fontWeight: '700', color: '#0ea5e9', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  phoneRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' },
  prefix: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, justifyContent: 'center' },
  prefixText: { fontSize: 14, color: '#374151', fontWeight: '600' },
  phoneInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  passwordRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, overflow: 'hidden' },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  eyeBtn: { paddingHorizontal: 12, justifyContent: 'center' },
  eyeText: { fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 13, marginTop: 8 },
  btn: {
    marginTop: 20,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
