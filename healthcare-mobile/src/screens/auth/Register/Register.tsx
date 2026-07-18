import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useRegister } from './useRegister';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function Register({ navigation }: Props): JSX.Element {
  const {
    fullName, phone, email, password, confirmPassword, showPassword,
    loading, error,
    setFullName, setPhone, setEmail, setPassword, setConfirmPassword,
    togglePassword, handleRegister, goToLogin,
  } = useRegister(navigation);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Green Header ── */}
      <View style={styles.header}>
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
        <Text style={styles.welcomeTitle}>Create your account</Text>
        <Text style={styles.welcomeSub}>Book home healthcare visits in under a minute.</Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputRow}>
          <View style={styles.fieldIconBox}>
            <Ionicons name="person-outline" size={16} color={Colors.neutral} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Your full name"
            placeholderTextColor={Colors.neutralMuted}
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />
        </View>

        {/* Phone */}
        <Text style={[styles.label, styles.labelSpaced]}>Phone Number</Text>
        <View style={styles.inputRow}>
          <View style={styles.prefixBox}>
            <Ionicons name="call-outline" size={16} color={Colors.primary} />
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
          />
        </View>

        {/* Email (optional) */}
        <Text style={[styles.label, styles.labelSpaced]}>
          Email <Text style={styles.labelOptional}>(optional)</Text>
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.fieldIconBox}>
            <Ionicons name="mail-outline" size={16} color={Colors.neutral} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="you@example.com"
            placeholderTextColor={Colors.neutralMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <Text style={[styles.label, styles.labelSpaced]}>Password</Text>
        <View style={styles.inputRow}>
          <View style={styles.fieldIconBox}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.neutral} />
          </View>
          <TextInput
            style={[styles.textInput, styles.passwordInput]}
            placeholder="At least 8 characters"
            placeholderTextColor={Colors.neutralMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoComplete="password-new"
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={togglePassword} activeOpacity={0.7}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.neutral}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={[styles.label, styles.labelSpaced]}>Confirm Password</Text>
        <View style={styles.inputRow}>
          <View style={styles.fieldIconBox}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.neutral} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Re-enter your password"
            placeholderTextColor={Colors.neutralMuted}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="password-new"
          />
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Create Account */}
        <TouchableOpacity
          style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.signInBtnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={goToLogin}>Sign In</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.xl,
  },
  logoIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  crossH: {
    position: 'absolute',
    width: 30,
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  crossV: {
    position: 'absolute',
    width: 8,
    height: 30,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  labelOptional: {
    fontWeight: '400',
    color: Colors.neutralMuted,
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
  prefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRightWidth: 1.5,
    borderRightColor: Colors.neutralBorder,
  },
  fieldIconBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
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
