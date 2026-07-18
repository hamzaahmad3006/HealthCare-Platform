import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppSelector } from '../../../store';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { Booking } from '../../../types/booking.types';
import type { ApiServiceType } from '../../../types/useNewBooking.types';

type HomeNavProp = NativeStackNavigationProp<CustomerStackParamList>;

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'TIME_PROPOSED', 'PENDING_DOCTOR'];

// Backend seeds these fixed codes (prisma/seed.ts) — map each to an icon since
// the ServiceType model itself has no icon field.
const SERVICE_ICON_BY_CODE: Record<string, string> = {
  NURSING: 'bandage',
  CAREGIVER: 'human-handshelp',
  LAB_SAMPLING: 'flask',
  VISITING_DOCTOR: 'stethoscope',
  PHYSIOTHERAPY: 'human-wheelchair',
  AMBULANCE: 'ambulance',
};
const DEFAULT_SERVICE_ICON = 'medical-bag';

export interface ServiceOption {
  id: string;
  name: string;
  icon: string;
}

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
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

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

  const fetchServices = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiServiceType[] }>(API.SERVICE_TYPES);
      setServices(
        data.data.map((s) => ({
          id: s.id,
          name: s.name,
          icon: SERVICE_ICON_BY_CODE[s.code] ?? DEFAULT_SERVICE_ICON,
        })),
      );
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => { fetchNext(); }, [fetchNext]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'there';
  const greeting = greetingFor(new Date().getHours());

  const goToBooking = (id: string): void => navigation.navigate('BookingDetail', { id });
  const goToNewBooking = (serviceTypeId?: string): void => navigation.navigate('NewBooking', serviceTypeId ? { serviceTypeId } : undefined);

  return {
    firstName,
    greeting,
    nextBooking,
    loading,
    services,
    servicesLoading,
    goToBooking,
    goToNewBooking,
  };
}
