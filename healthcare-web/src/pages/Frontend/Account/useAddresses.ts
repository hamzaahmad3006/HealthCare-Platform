import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Address, CityWithZones } from '../../../types/booking.types';

export interface AddressFormData {
  label?: string;
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  area: string;
  cityId: string;
  postalCode?: string;
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cities, setCities] = useState<CityWithZones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  const reload = useCallback(() => setReloadFlag((n) => n + 1), []);

  useEffect(() => {
    api
      .get<{ success: true; data: CityWithZones[] }>(API.CITIES)
      .then(({ data }) => setCities(data.data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<{ success: true; data: Address[]; meta: unknown }>(`${API.USERS.ADDRESSES}?limit=50`)
      .then(({ data }) => { if (!cancelled) setAddresses(data.data); })
      .catch(() => null)
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadFlag]);

  const openAdd = useCallback(() => { setEditing(null); setModalOpen(true); }, []);
  const openEdit = useCallback((a: Address) => { setEditing(a); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setEditing(null); }, []);

  const handleSave = useCallback(async (formData: AddressFormData): Promise<void> => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(API.USERS.ADDRESS_BY_ID(editing.id), formData);
        toast.success('Address updated');
      } else {
        await api.post(API.USERS.ADDRESSES, formData);
        toast.success('Address saved');
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
      await api.delete(API.USERS.ADDRESS_BY_ID(id));
      toast.success('Address removed');
      reload();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setDeleting(null);
    }
  }, [reload]);

  return {
    addresses, cities, isLoading,
    modalOpen, editing, saving, deleting,
    openAdd, openEdit, closeModal, handleSave, handleDelete,
  };
}
