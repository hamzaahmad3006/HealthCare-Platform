import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomerTabs } from './CustomerTabs';
import { BookingDetail } from '../screens/dashboard/BookingDetail/BookingDetail';
import { MyPatients } from '../screens/dashboard/MyPatients/MyPatients';
import { SelectPackage } from '../screens/dashboard/NewBooking/SelectPackage';
import { Colors } from '../constants/theme';
import type { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Tabs"          component={CustomerTabs}   options={{ headerShown: false }} />
      <Stack.Screen name="BookingDetail" component={BookingDetail}  options={{ title: 'Booking Detail' }} />
      <Stack.Screen name="MyPatients"    component={MyPatients}     options={{ title: 'My Patients' }} />
      <Stack.Screen name="NewBooking"    component={SelectPackage}  options={{ title: 'New Booking' }} />
    </Stack.Navigator>
  );
}
