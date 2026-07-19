import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

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
  BookingDetail: { id: string };
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
export type MyBookingsScreenProps = NativeStackScreenProps<CustomerStackParamList, 'MyBookings'>;
export type BookingDetailScreenProps = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;
