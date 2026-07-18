import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { StaffPatient, ApiStaffPatient } from '../../../types/StaffPatients.types';

function mapPatient(p: ApiStaffPatient): StaffPatient {
  return {
    id: p.id,
    fullName: p.fullName,
    primaryCondition: p.primaryCondition ?? undefined,
    relationshipToCustomer: p.relationshipToCustomer ?? undefined,
  };
}

export function useStaffPatients() {
  const [patients, setPatients] = useState<StaffPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Backend scopes STAFF to patients from bookings they've been assigned to
  // (via BookingAssignment) — no query params needed beyond a generous page size.
  const fetchPatients = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiStaffPatient[] }>(API.PATIENTS.LIST, {
        params: { limit: 100 },
      });
      setPatients(data.data.map(mapPatient));
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchPatients();
  };

  return { patients, loading, refreshing, onRefresh };
}
