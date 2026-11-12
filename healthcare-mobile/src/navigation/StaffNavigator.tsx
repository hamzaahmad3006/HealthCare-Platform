import type { JSX } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StaffTabs } from './StaffTabs';
import { VisitDetail } from '../screens/staff/VisitDetail/VisitDetail';
import { Notifications } from '../screens/shared/Notifications/Notifications';
import { DoctorRequests } from '../screens/staff/DoctorRequests/DoctorRequests';
import { Colors } from '../constants/theme';
import type { StaffStackParamList } from './types';

import { StaffAccessProvider } from '../screens/staff/Onboarding/StaffAccess';
import { StaffWorkGate } from '../screens/staff/Onboarding/StaffWorkGate';
import { StaffSetup } from '../screens/staff/Onboarding/StaffSetup';
import { CompleteProfile } from '../screens/staff/Onboarding/CompleteProfile';
import { StaffDocuments } from '../screens/staff/Onboarding/StaffDocuments';

function VerifiedTabs() {
  return (
    <StaffWorkGate>
      <StaffTabs />
    </StaffWorkGate>
  );
}
function VerifiedVisit() {
  return (
    <StaffWorkGate>
      <VisitDetail />
    </StaffWorkGate>
  );
}

function VerifiedDoctorRequests() {
  return (
    <StaffWorkGate>
      <DoctorRequests />
    </StaffWorkGate>
  );
}

const Stack = createNativeStackNavigator<StaffStackParamList>();

export function StaffNavigator(): JSX.Element {
  return (
    <StaffAccessProvider>
      <Stack.Navigator
        initialRouteName="Tabs"
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="DoctorRequests"
          component={VerifiedDoctorRequests}
          options={{ title: 'Doctor Requests' }}
        />
        <Stack.Screen
          name="Tabs"
          component={VerifiedTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VisitDetail"
          component={VerifiedVisit}
          options={{ title: 'Visit Detail' }}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StaffSetup"
          component={StaffSetup}
          options={{ title: 'Staff Verification' }}
        />
        <Stack.Screen
          name="CompleteProfile"
          component={CompleteProfile}
          options={{ title: 'Complete Profile' }}
        />
        <Stack.Screen
          name="StaffDocuments"
          component={StaffDocuments}
          options={{ title: 'Verification Documents' }}
        />
      </Stack.Navigator>
    </StaffAccessProvider>
  );
}
