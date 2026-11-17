import type { JSX } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StaffManagement } from '../screens/admin/StaffManagement/StaffManagement';
import { Colors } from '../constants/theme';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="StaffManagement"
        component={StaffManagement}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
