import type { NativeStackScreenProps } from '@react-navigation/native-stack';

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
  Tabs: undefined;
  BookingDetail: { id: string };
  MyPatients: undefined;
  NewBooking: undefined;
};

export type StaffTabParamList = {
  Home: undefined;
  Visits: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type StaffStackParamList = {
  Tabs: undefined;
  VisitDetail: { id: string };
  StaffPatients: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: undefined;
  Staff: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type MyBookingsScreenProps = NativeStackScreenProps<CustomerStackParamList, 'MyBookings'>;
export type BookingDetailScreenProps = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;
