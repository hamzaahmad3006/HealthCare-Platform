import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { StaffHome } from '../screens/staff/Home/Home';
import { Colors, FontSize } from '../constants/theme';
import { View, Text, StyleSheet } from 'react-native';

export type StaffTabParamList = {
  Home: undefined;
  Visits: undefined;
  Reports: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<StaffTabParamList>();

function Placeholder({ title }: { title: string }) {
  return (
    <View style={s.ph}>
      <Text style={s.phText}>{title}</Text>
    </View>
  );
}

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
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Visits"
        component={() => <Placeholder title="Visits" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="medical-bag" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={() => <Placeholder title="Reports" />}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialDesignIcons name="file-document-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={() => <Placeholder title="Profile" />}
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
  ph: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  phText: { fontSize: 18, fontWeight: '600', color: '#9CA3AF' },
});
