import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { StaffHome } from '../screens/staff/Home/Home';
import { StaffVisits } from '../screens/staff/Visits/StaffVisits';
import { StaffReports } from '../screens/staff/Reports/StaffReports';
import { StaffProfile } from '../screens/staff/Profile/StaffProfile';
import { Colors, FontSize } from '../constants/theme';

export type StaffTabParamList = {
  Home: undefined;
  Visits: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StaffTabParamList>();

export function StaffTabs(): JSX.Element {
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
        component={StaffHome}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Visits"
        component={StaffVisits}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="medical-bag" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={StaffReports}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="file-document-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={StaffProfile}
        options={{ tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="account-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
