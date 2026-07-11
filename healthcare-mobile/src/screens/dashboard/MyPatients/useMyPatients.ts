import { useCallback, useEffect, useState } from 'react';
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

  const fetchPatients = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: Patient[] }>(API.PATIENTS.LIST);
      setPatients(data.data);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
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

  return { patients, loading, refreshing, saving, onRefresh, savePatient, deletePatient };
}
