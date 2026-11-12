import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeScreenProps, CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Reports: undefined;
  Account: undefined;
};

export type CustomerStackParamList = {
  Tabs: NavigatorScreenParams<CustomerTabParamList> | undefined;
  BookingDetail: { id: string; refreshKey?: number };
  MyPatients: undefined;
  NewBooking: { serviceTypeId?: string } | undefined;
  Notifications: undefined;
};

export type StaffTabParamList = {
  Home: undefined;
  Visits: undefined;
  Patients: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type StaffStackParamList = {
  DoctorRequests: { refreshKey?: number } | undefined;
  Tabs: NavigatorScreenParams<StaffTabParamList> | undefined;
  VisitDetail: { id: string };
  Notifications: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: NavigatorScreenParams<CustomerStackParamList> | undefined;
  Staff: NavigatorScreenParams<StaffStackParamList> | undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type CustomerTabNavigationProp<Route extends keyof CustomerTabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, Route>,
  NativeStackNavigationProp<CustomerStackParamList, 'Tabs'>
>;
export type MyBookingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<CustomerTabParamList, 'Bookings'>,
  NativeStackScreenProps<CustomerStackParamList, 'Tabs'>
>;
export type BookingDetailScreenProps = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;
