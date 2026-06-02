import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyBookings } from '../screens/dashboard/MyBookings/MyBookings';
import { BookingDetail } from '../screens/dashboard/BookingDetail/BookingDetail';
import { Colors } from '../constants/theme';
import type { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function CustomerNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="MyBookings"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="MyBookings"
        component={MyBookings}
        options={{ title: 'My Bookings' }}
      />
      <Stack.Screen
        name="BookingDetail"
        component={BookingDetail}
        options={{ title: 'Booking Detail' }}
      />
    </Stack.Navigator>
  );
}
