import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppSelector } from '../../../store';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { Booking } from '../../../types/booking.types';

type HomeNavProp = NativeStackNavigationProp<CustomerStackParamList>;

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'TIME_PROPOSED', 'PENDING_DOCTOR'];

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export function useHome() {
  const navigation = useNavigation<HomeNavProp>();
  const user = useAppSelector((s) => s.auth.user);

  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNext = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: Booking[] }>(API.BOOKINGS.LIST);
      const now = Date.now();
      const upcoming = data.data
        .filter((b) => UPCOMING_STATUSES.includes(b.status) && new Date(b.requestedStartAt).getTime() >= now)
        .sort((a, b) => new Date(a.requestedStartAt).getTime() - new Date(b.requestedStartAt).getTime());
      setNextBooking(upcoming[0] ?? null);
    } catch {
      setNextBooking(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'there';
  const greeting = greetingFor(new Date().getHours());

  const goToBooking = (id: string): void => navigation.navigate('BookingDetail', { id });
  const goToNewBooking = (): void => navigation.navigate('NewBooking');

  return { firstName, greeting, nextBooking, loading, goToBooking, goToNewBooking };
}
