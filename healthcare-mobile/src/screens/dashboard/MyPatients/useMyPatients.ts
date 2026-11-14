import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { Patient, PatientInput } from '../../../types/useMyPatients.types';

// Strip empty strings so we don't send an invalid dateOfBirth ('' -> Invalid Date on the server).
function toPayload(input: PatientInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { fullName: input.fullName.trim() };
  if (input.gender) payload.gender = input.gender;
  if (input.dateOfBirth?.trim()) payload.dateOfBirth = input.dateOfBirth.trim();
  if (input.relationshipToCustomer?.trim()) payload.relationshipToCustomer = input.relationshipToCustomer.trim();
  if (input.primaryCondition?.trim()) payload.primaryCondition = input.primaryCondition.trim();
  if (input.allergies?.trim()) payload.allergies = input.allergies.trim();
  return payload;
}

export function useMyPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const requestId = useRef(0);
  const pageInFlight = useRef(false);

  const fetchPatients = useCallback(async (page = 1): Promise<void> => {
    if (page > 1 && pageInFlight.current) return;
    const current = ++requestId.current;
    if (page > 1) {
      pageInFlight.current = true;
      setLoadingMore(true);
    } else {
      pageInFlight.current = false;
      setLoadingMore(false);
    }
    setError(null);
    try {
      const { data } = await api.get<{ success: true; data: Patient[]; meta: { hasNext: boolean } }>(
        API.PATIENTS.LIST, { params: { page, limit: 20 } },
      );
      if (current !== requestId.current) return;
      setPatients(previous => page === 1 ? data.data : [
        ...previous,
        ...data.data.filter(patient => !previous.some(item => item.id === patient.id)),
      ]);
      setHasNext(data.meta.hasNext);
      setNextPage(page + 1);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(extractApiError(err));
      if (page === 1) {
        setPatients([]);
        setHasNext(false);
      }
    } finally {
      if (current === requestId.current) {
        pageInFlight.current = false;
        setLoadingMore(false);
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchPatients(1);
  };
  const retry = (): void => { fetchPatients(error && patients.length > 0 ? nextPage : 1); };
  const loadMore = (): void => {
    if (!hasNext || loading || refreshing || pageInFlight.current || error) return;
    fetchPatients(nextPage);
  };

  // Returns true on success so the screen can close its modal.
  const savePatient = async (input: PatientInput, editingId?: string): Promise<boolean> => {
    if (!input.fullName.trim()) {
      Alert.alert('Required', 'Patient name is required.');
      return false;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(API.PATIENTS.UPDATE(editingId), toPayload(input));
      } else {
        await api.post(API.PATIENTS.CREATE, toPayload(input));
      }
      await fetchPatients();
      return true;
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = (id: string): void => {
    Alert.alert('Remove patient', 'Are you sure you want to remove this patient?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(API.PATIENTS.DELETE(id));
            await fetchPatients();
          } catch (err) {
            Alert.alert('Error', extractApiError(err));
          }
        },
      },
    ]);
  };

  return { patients, loading, refreshing, saving, loadingMore, error, hasNext, onRefresh, retry, loadMore, savePatient, deletePatient };
}
