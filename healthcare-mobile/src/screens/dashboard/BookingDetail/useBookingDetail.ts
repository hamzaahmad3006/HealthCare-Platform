import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { customerCanCancel } from '../../../utils/doctorBooking';
import { respondToDoctorTime } from '../../../api/doctorBooking';
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
  const requestSequence = useRef(0);
  const [error, setError] = useState('');
  const [actingTime, setActingTime] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBooking = useCallback(async (): Promise<void> => {
    const token = ++requestSequence.current;
    setError(''); setLoading(true);
    try {
      const { data } = await api.get<{ success: true; data: BookingDetail }>(
        API.BOOKINGS.DETAIL(id),
        route.params.refreshKey ? { headers: { 'Cache-Control': 'no-cache' } } : undefined,
      );
      if (token !== requestSequence.current) return;
      setBooking(data.data);
      navigation.setOptions({ title: data.data.bookingNumber });
    } catch (err) {
      if (token === requestSequence.current) setError(extractApiError(err));
    } finally {
      if (token === requestSequence.current) setLoading(false);
    }
  }, [id, navigation, route.params.refreshKey]);

  useFocusEffect(useCallback(() => { void fetchBooking(); return () => { requestSequence.current++; }; }, [fetchBooking]));

  const openCancelModal = (): void => {
    setCancelReason('');
    setCancelModalVisible(true);
  };
  const closeCancelModal = (): void => setCancelModalVisible(false);

  // Backend requires a non-empty cancellation reason (booking.controller.ts's
  // cancel handler: z.object({ reason: z.string().min(1) })).
  const confirmCancel = async (): Promise<void> => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for cancelling.');
      return;
    }
    setCancelling(true);
    try {
      await api.patch(API.BOOKINGS.CANCEL(id), { reason: cancelReason.trim() });
      setCancelModalVisible(false);
      await fetchBooking();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = booking ? customerCanCancel(booking.status) : false;
  const handleTimeResponse = async (accept: boolean) => {
    if (actingTime) return;
    setActingTime(true);
    try { await respondToDoctorTime(id, accept); await fetchBooking(); }
    catch (err) { Alert.alert('Could not save your response', extractApiError(err)); }
    finally { setActingTime(false); }
  };

  return {
    booking,
    loading, error, reload: fetchBooking, actingTime, handleTimeResponse,
    cancelling,
    canCancel,
    cancelModalVisible,
    cancelReason,
    setCancelReason,
    openCancelModal,
    closeCancelModal,
    confirmCancel,
  };
}
