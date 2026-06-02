import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type CustomerStackParamList = {
  MyBookings: undefined;
  BookingDetail: { id: string };
  NewBooking: undefined;
  MyPatients: undefined;
  MyReports: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Customer: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type MyBookingsScreenProps = NativeStackScreenProps<CustomerStackParamList, 'MyBookings'>;
export type BookingDetailScreenProps = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;
