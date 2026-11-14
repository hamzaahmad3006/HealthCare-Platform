import { ActivityIndicator, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StaffStackParamList } from '../../../navigation/types';
import { useStaffAccess } from './StaffAccess';
import { useAppDispatch } from '../../../store';
import { logout } from '../../../store/slices/authSlice';
import {
  FlowForm,
  FlowButton,
  FlowError,
  flowStyles,
} from '../../../components/FlowForm';

export function StaffSetup() {
  const { profile, error, loading, refresh } = useStaffAccess();
  const navigation =
    useNavigation<NativeStackNavigationProp<StaffStackParamList>>();
  const dispatch = useAppDispatch();
  return (
    <FlowForm title="Staff verification">
      {loading ? (
        <ActivityIndicator accessibilityLabel="Checking verification" />
      ) : null}
      <FlowError message={error} />
      {profile ? (
        <>
          <Text style={flowStyles.label}>
            Status: {profile.verificationStatus ?? 'PENDING'}
          </Text>
          <Text style={flowStyles.body}>
            {!profile.profileCompletedAt
              ? 'Complete your profile, then upload verification documents.'
              : profile.verificationStatus === 'VERIFIED'
              ? 'Your profile is verified. You can work on assigned visits.'
              : profile.verificationStatus === 'REJECTED'
              ? 'Your verification was rejected. Correct your profile or upload replacement documents for admin review.'
              : 'Your verification is pending. Check your documents for any corrections requested by admin. Work actions unlock after verification.'}
          </Text>
          <FlowButton
            title={
              profile.profileCompletedAt ? 'Edit profile' : 'Complete profile'
            }
            disabled={loading}
            onPress={() => navigation.navigate('CompleteProfile')}
          />
          <FlowButton
            title="Verification documents"
            onPress={() => navigation.navigate('StaffDocuments')}
          />
        </>
      ) : null}
      <FlowButton
        title="Refresh verification status"
        disabled={loading}
        onPress={() => {
          void refresh();
        }}
      />
      <FlowButton
        title="Notifications"
        onPress={() => navigation.navigate('Notifications')}
      />
      <FlowButton
        title="Logout"
        onPress={() => {
          void dispatch(logout()).unwrap().catch(() => Alert.alert('Sign out failed', 'Could not clear your secure session. Please try again.'));
        }}
      />
    </FlowForm>
  );
}
