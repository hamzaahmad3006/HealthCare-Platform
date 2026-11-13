import type { ReactNode } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';

export function FlowForm({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={flowStyles.root}>
      <KeyboardAvoidingView
        style={flowStyles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={flowStyles.content}
        >
          <Text style={flowStyles.title}>{title}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function FlowInput({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <>
      <Text style={flowStyles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Colors.textMuted}
        style={flowStyles.input}
        {...props}
      />
    </>
  );
}
export function FlowButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      style={[flowStyles.button, (disabled || loading) && flowStyles.disabled]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={flowStyles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function FlowError({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={flowStyles.error}>
      {message}
    </Text>
  ) : null;
}
export const flowStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutralLight },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, color: Colors.primary, fontWeight: '800' },
  label: { color: Colors.textSecondary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonText: { color: Colors.white, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: Colors.danger },
  body: { color: Colors.textSecondary, lineHeight: 22 },
  option: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
    backgroundColor: Colors.white,
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
});
