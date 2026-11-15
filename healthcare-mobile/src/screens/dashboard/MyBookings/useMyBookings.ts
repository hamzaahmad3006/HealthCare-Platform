import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { CustomerTabNavigationProp } from '../../../navigation/types';
import type { Booking } from '../../../types/booking.types';

type RootNavProp = CustomerTabNavigationProp<'Bookings'>;

export function useMyBookings() {
  const navigation = useNavigation<RootNavProp>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { data } = await api.get<{ success: true; data: Booking[] }>(API.BOOKINGS.LIST);
      setBookings(data.data);
    } catch (err) {
      const msg = extractApiError(err);
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void fetchBookings(); }, [fetchBookings]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const retry = () => {
    setLoading(true);
    fetchBookings();
  };

  const goToDetail = (id: string) => navigation.navigate('BookingDetail', { id });

  return {
    bookings,
    loading,
    refreshing,
    error,
    onRefresh,
    retry,
    goToDetail,
  };
}
