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
  ScrollView,
  StatusBar,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { login } from '../../store/slices/authSlice';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import type { LoginScreenProps } from '../../navigation/types';

export function LoginScreen(_props: LoginScreenProps): JSX.Element {
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Green Header ── */}
      <View style={styles.header}>
        {/* Medical cross icon */}
        <View style={styles.logoIcon}>
          <View style={styles.crossH} />
          <View style={styles.crossV} />
        </View>
        <Text style={styles.brandName}>HomeHealth</Text>
        <Text style={styles.brandSub}>Pakistan</Text>
      </View>

      {/* ── White form sheet ── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeSub}>Sign in to manage your bookings and care.</Text>

        {/* Phone field */}
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputRow, phoneFocused && styles.inputRowFocused]}>
          <View style={styles.prefixBox}>
            <Text style={styles.prefixText}>+92</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="3001234567"
            placeholderTextColor={Colors.neutralMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoComplete="tel"
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />
        </View>

        {/* Password field */}
        <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
        <View style={[styles.inputRow, passFocused && styles.inputRowFocused]}>
          <TextInput
            style={[styles.textInput, styles.passwordInput]}
            placeholder="Enter your password"
            placeholderTextColor={Colors.neutralMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Sign in button */}
        <TouchableOpacity
          style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.signInBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider hint */}
        <Text style={styles.footerHint}>
          Don't have an account?{' '}
          <Text style={styles.footerLink}>Contact admin to register</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HEADER_HEIGHT = 260;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  /* ─── Header ─── */
  header: {
    height: HEADER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  logoIcon: {
    width: 64,
    height: 64,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  crossH: {
    position: 'absolute',
    width: 36,
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  crossV: {
    position: 'absolute',
    width: 10,
    height: 36,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  brandName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  brandSub: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  /* ─── Sheet ─── */
  sheet: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    padding: Spacing.xl,
    paddingTop: 32,
    paddingBottom: 48,
  },

  welcomeTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '400',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },

  /* ─── Form ─── */
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.neutralLight,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  prefixBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRightWidth: 1.5,
    borderRightColor: Colors.neutralBorder,
  },
  prefixText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  passwordInput: {
    paddingRight: 0,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },

  /* ─── Error ─── */
  errorBox: {
    marginTop: Spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '500',
  },

  /* ─── Button ─── */
  signInBtn: {
    marginTop: Spacing.xl,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  signInBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },

  /* ─── Footer ─── */
  footerHint: {
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
