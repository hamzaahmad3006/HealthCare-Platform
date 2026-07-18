import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { ApiVisit } from '../../../types/visit.types';
import type { Visit, TabFilter } from '../../../types/StaffVisits.types';
import { serviceLabelFromCode, startOfDayISO, endOfDayISO } from '../../../utils/format';

const ACTIVE_STATUSES = ['SCHEDULED', 'ASSIGNED', 'EN_ROUTE', 'CHECKED_IN'];

function toVisit(v: ApiVisit, nameById: Map<string, string>): Visit {
  return {
    id: v.id,
    patientName: nameById.get(v.booking.patientId) ?? v.booking.bookingNumber,
    service: serviceLabelFromCode(v.booking.serviceType.code),
    scheduledTime: v.scheduledStartAt,
    bookingNumber: v.booking.bookingNumber,
    status: v.status,
  };
}

export function useStaffVisits() {
  const [activeTab, setActiveTab] = useState<TabFilter>('TODAY');
  const [all, setAll] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVisits = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiVisit[] }>(API.VISITS.LIST, {
        params: { limit: 100 },
      });
      const visits = data.data;

      const patientIds = Array.from(new Set(visits.map((v) => v.booking.patientId)));
      let nameById = new Map<string, string>();
      if (patientIds.length > 0) {
        try {
          const { data: patientsRes } = await api.get<{ success: true; data: { id: string; fullName: string }[] }>(
            API.PATIENTS.LIST,
          );
          nameById = new Map(patientsRes.data.map((p) => [p.id, p.fullName]));
        } catch {
          // Non-critical — falls back to booking numbers.
        }
      }

      setAll(
        visits
          .map((v) => toVisit(v, nameById))
          .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()),
      );
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      setAll([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchVisits();
  };

  const todayStart = startOfDayISO();
  const todayEnd = endOfDayISO();

  const visits = all.filter((v) => {
    const t = new Date(v.scheduledTime).getTime();
    if (activeTab === 'TODAY') {
      return t >= new Date(todayStart).getTime() && t <= new Date(todayEnd).getTime();
    }
    if (activeTab === 'UPCOMING') {
      return t > new Date(todayEnd).getTime() && ACTIVE_STATUSES.includes(v.status);
    }
    return v.status === 'COMPLETED';
  });

  return { activeTab, setActiveTab, visits, loading, refreshing, onRefresh };
}
