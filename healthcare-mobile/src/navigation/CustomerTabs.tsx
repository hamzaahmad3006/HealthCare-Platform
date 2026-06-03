import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Home } from '../screens/dashboard/Home/Home';
import { MyBookings } from '../screens/dashboard/MyBookings/MyBookings';
import { MyReports } from '../screens/dashboard/MyReports/MyReports';
import { Account } from '../screens/dashboard/Account/Account';
import { Colors, FontSize } from '../constants/theme';
import type { CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export function CustomerTabs(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.neutral,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.neutralBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookings}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="calendar-month" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={MyReports}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="file-document-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Account"
        component={Account}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="account-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
