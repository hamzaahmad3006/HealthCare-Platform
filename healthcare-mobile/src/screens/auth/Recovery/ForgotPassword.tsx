import { useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { recoveryPhone } from '../../../utils/recovery';
import {
  FlowForm,
  FlowInput,
  FlowButton,
  FlowError,
  flowStyles,
} from '../../../components/FlowForm';

export function ForgotPassword({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const [phone, setPhone] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const normalized = recoveryPhone(phone);
      await api.post(API.AUTH.FORGOT_PASSWORD, { phone: normalized });
      navigation.navigate('ResetPassword', { phone: normalized });
    } catch (err) {
      setError(
        err instanceof Error && !('response' in err)
          ? err.message
          : extractApiError(err),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <FlowForm title="Forgot password">
      <Text style={flowStyles.body}>
        Enter your account phone number. If an account exists, a reset code will
        be sent to its registered contact details.
      </Text>
      <FlowInput
        label="Phone number"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={phone}
        onChangeText={setPhone}
        editable={!busy}
      />
      <FlowError message={error} />
      <FlowButton
        title="Send reset code"
        loading={busy}
        onPress={() => {
          void submit();
        }}
      />
      <FlowButton
        title="Back to login"
        disabled={busy}
        onPress={() => navigation.navigate('Login')}
      />
    </FlowForm>
  );
}
