import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { Booking } from '../../../types/booking.types';

type MyBookingsNavProp = NativeStackNavigationProp<CustomerStackParamList, 'MyBookings'>;

export function useMyBookings(navigation: MyBookingsNavProp) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: Booking[] }>(API.BOOKINGS.LIST);
      setBookings(data.data);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const goToDetail = (id: string) => navigation.navigate('BookingDetail', { id });

  return {
    bookings,
    loading,
    refreshing,
    onRefresh,
    goToDetail,
  };
}
