import { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { useAppDispatch } from '../../../store';
import { resetPassword } from '../../../store/slices/authSlice';
import { resetPayload } from '../../../utils/recovery';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import {
  FlowForm,
  FlowInput,
  FlowButton,
  FlowError,
  flowStyles,
} from '../../../components/FlowForm';

export function ResetPassword({
  navigation,
  route,
}: NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>) {
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const phone = route.params.phone;
  const submit = async () => {
    if (busy) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const payload = resetPayload(phone, otp, password, confirm);
      const result = await dispatch(resetPassword(payload));
      if (resetPassword.rejected.match(result)) {
        setError(String(result.payload));
        setOtp('');
      } else {
        setOtp('');
        setPassword('');
        setConfirm('');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Please check your details.',
      );
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    setOtp('');
    try {
      await api.post(API.AUTH.FORGOT_PASSWORD, { phone });
      setMessage(
        'If an account exists, a new code has been sent. Use only the newest code.',
      );
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <FlowForm title="Reset password">
      <Text style={flowStyles.body}>
        If an account exists for {phone}, a code has been sent. Codes expire
        after 15 minutes.
      </Text>
      <FlowInput
        label="Reset code"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        editable={!busy}
      />
      <FlowInput
        label="New password"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        editable={!busy}
      />
      <FlowInput
        label="Confirm new password"
        secureTextEntry
        autoComplete="new-password"
        value={confirm}
        onChangeText={setConfirm}
        editable={!busy}
      />
      <FlowError message={error} />
      <Text style={flowStyles.body}>{message}</Text>
      <FlowButton
        title="Reset password"
        onPress={() => {
          void submit();
        }}
        loading={busy}
      />
      <FlowButton
        title="Resend code"
        onPress={() => {
          void resend();
        }}
        disabled={busy}
      />
      <FlowButton
        title="Use another phone number"
        onPress={() => navigation.goBack()}
        disabled={busy}
      />
    </FlowForm>
  );
}
