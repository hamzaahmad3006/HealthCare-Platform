import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Home } from '../screens/dashboard/Home/Home';
import { MyBookings } from '../screens/dashboard/MyBookings/MyBookings';
import { Colors, FontSize } from '../constants/theme';
import type { CustomerTabParamList } from './types';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={s.placeholder}>
      <Text style={s.placeholderText}>{title}</Text>
    </View>
  );
}

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
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookings}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="calendar-month" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={() => <PlaceholderScreen title="Reports" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="file-document-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={() => <PlaceholderScreen title="Account" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="account-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
