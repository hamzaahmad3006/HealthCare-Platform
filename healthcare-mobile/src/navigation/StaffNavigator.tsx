import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StaffTabs } from './StaffTabs';
import { VisitDetail } from '../screens/staff/VisitDetail/VisitDetail';
import { StaffPatients } from '../screens/staff/Patients/StaffPatients';
import { Notifications } from '../screens/shared/Notifications/Notifications';
import { Colors } from '../constants/theme';
import type { StaffStackParamList } from './types';

const Stack = createNativeStackNavigator<StaffStackParamList>();

export function StaffNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Tabs"          component={StaffTabs}     options={{ headerShown: false }} />
      <Stack.Screen name="VisitDetail"   component={VisitDetail}   options={{ title: 'Visit Detail' }} />
      <Stack.Screen name="StaffPatients" component={StaffPatients} options={{ title: 'Patients' }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
