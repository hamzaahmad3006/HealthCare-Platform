import type { JSX } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StaffTabs } from './StaffTabs';
import { VisitDetail } from '../screens/staff/VisitDetail/VisitDetail';
import { Notifications } from '../screens/shared/Notifications/Notifications';
import { DoctorRequests } from '../screens/staff/DoctorRequests/DoctorRequests';
import { Colors } from '../constants/theme';
import type { StaffStackParamList } from './types';

const Stack = createNativeStackNavigator<StaffStackParamList>();

export function StaffNavigator(): JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Tabs"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="DoctorRequests" component={DoctorRequests} options={{ title: 'Doctor Requests' }} />
      <Stack.Screen name="Tabs"          component={StaffTabs}     options={{ headerShown: false }} />
      <Stack.Screen name="VisitDetail"   component={VisitDetail}   options={{ title: 'Visit Detail' }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
