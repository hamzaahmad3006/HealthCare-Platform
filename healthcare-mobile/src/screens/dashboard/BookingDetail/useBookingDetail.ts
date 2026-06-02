import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { BookingDetail } from '../../../types/booking.types';

type BookingDetailNavProp = NativeStackNavigationProp<CustomerStackParamList, 'BookingDetail'>;
type BookingDetailRouteProp = RouteProp<CustomerStackParamList, 'BookingDetail'>;

export function useBookingDetail(
  navigation: BookingDetailNavProp,
  route: BookingDetailRouteProp,
) {
  const { id } = route.params;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: BookingDetail }>(
        API.BOOKINGS.DETAIL(id),
      );
      setBooking(data.data);
      navigation.setOptions({ title: data.data.bookingNumber });
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const handleCancel = () => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await api.patch(API.BOOKINGS.CANCEL(id));
            await fetchBooking();
          } catch (err) {
            Alert.alert('Error', extractApiError(err));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const canCancel = booking
    ? ['PENDING', 'CONFIRMED'].includes(booking.status)
    : false;

  return {
    booking,
    loading,
    cancelling,
    canCancel,
    handleCancel,
  };
}
