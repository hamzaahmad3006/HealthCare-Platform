import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Patient, PatientFormData } from '../../../types/patient.types';
import type { PaginationMeta } from '../../../types/api.types';

export function useMyPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const reload = useCallback(() => setReloadFlag((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        const { data } = await api.get<{ success: true; data: Patient[]; meta: PaginationMeta }>(
          `${API.USERS.PATIENTS}?${params.toString()}`,
        );
        if (cancelled) return;
        setPatients(data.data);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [page, reloadFlag]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((patient: Patient) => {
    setEditing(patient);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const handleSave = useCallback(async (formData: PatientFormData): Promise<void> => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(API.USERS.PATIENT_BY_ID(editing.id), formData);
        toast.success('Patient updated');
      } else {
        await api.post(API.USERS.PATIENTS, formData);
        toast.success('Patient added');
      }
      closeModal();
      reload();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  }, [editing, closeModal, reload]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setDeleting(id);
    try {
      await api.delete(API.USERS.PATIENT_BY_ID(id));
      toast.success('Patient removed');
      reload();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setDeleting(null);
    }
  }, [reload]);

  return {
    patients, meta, isLoading, error, page, setPage,
    modalOpen, editing, saving, deleting,
    openAdd, openEdit, closeModal, handleSave, handleDelete,
  };
}
