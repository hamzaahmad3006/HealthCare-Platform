import { useCallback, useEffect, useRef, useState } from 'react';
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

export function useStaffPatients(search: string) {
  const [patients, setPatients] = useState<StaffPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const requestId = useRef(0);
  const pageInFlight = useRef(false);

  const fetchPatients = useCallback(async (page = 1): Promise<void> => {
    if (page > 1 && pageInFlight.current) return;
    const current = ++requestId.current;
    if (page > 1) { pageInFlight.current = true; setLoadingMore(true); }
    else { pageInFlight.current = false; setLoadingMore(false); }
    setError(null);
    try {
      const { data } = await api.get<{ success: true; data: ApiStaffPatient[]; meta: { hasNext: boolean } }>(
        API.PATIENTS.LIST, { params: { page, limit: 20, ...(search.trim() ? { search: search.trim() } : {}) } },
      );
      if (current !== requestId.current) return;
      const incoming = data.data.map(mapPatient);
      setPatients(previous => page === 1 ? incoming : [
        ...previous, ...incoming.filter(patient => !previous.some(item => item.id === patient.id)),
      ]);
      setHasNext(data.meta.hasNext);
      setNextPage(page + 1);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(extractApiError(err));
      if (page === 1) { setPatients([]); setHasNext(false); }
    } finally {
      if (current === requestId.current) {
        pageInFlight.current = false;
        setLoadingMore(false);
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [search]);

  useEffect(() => {
    const currentRequests = requestId;
    requestId.current++;
    setLoading(true);
    setPatients([]);
    setError(null);
    const timer = setTimeout(() => { fetchPatients(); }, search ? 250 : 0);
    return () => { clearTimeout(timer); currentRequests.current++; };
  }, [search, fetchPatients]);

  const onRefresh = (): void => { setRefreshing(true); fetchPatients(1); };
  const retry = (): void => { fetchPatients(error && patients.length > 0 ? nextPage : 1); };
  const loadMore = (): void => {
    if (!hasNext || loading || refreshing || pageInFlight.current || error) return;
    fetchPatients(nextPage);
  };

  return { patients, loading, refreshing, loadingMore, error, onRefresh, retry, loadMore };
}
