import { useEffect, useState } from 'react';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Patient } from '../../../types/patient.types';
import type { PaginationMeta } from '../../../types/api.types';

export function useStaffPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api
      .get<{ success: true; data: Patient[]; meta: PaginationMeta }>(
        `${API.USERS.PATIENTS}?page=${page}&limit=20`,
      )
      .then(({ data }) => {
        if (cancelled) return;
        setPatients(data.data);
        setMeta(data.meta);
      })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, attempt]);

  return { patients, meta, isLoading, error, setPage, retry: () => setAttempt(value => value + 1) };
}
