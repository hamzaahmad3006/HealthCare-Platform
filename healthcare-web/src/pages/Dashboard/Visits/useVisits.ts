import { useEffect, useState } from 'react';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { BookingVisit, VisitStatus } from '../../../types/booking.types';
import type { PaginationMeta } from '../../../types/api.types';

interface VisitRow extends BookingVisit {
  booking?: { bookingNumber: string; customerUserId: string };
}

interface UseVisitsReturn {
  visits: VisitRow[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  statusFilter: VisitStatus | 'ALL';
  setStatusFilter: (v: VisitStatus | 'ALL') => void;
  dateFilter: string;
  setDateFilter: (d: string) => void;
  page: number;
  setPage: (p: number) => void;
}

export function useVisits(): UseVisitsReturn {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '50' });
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (dateFilter) {
          params.set('fromDate', `${dateFilter}T00:00:00Z`);
          params.set('toDate', `${dateFilter}T23:59:59Z`);
        }
        const { data } = await api.get<{
          success: true;
          data: VisitRow[];
          meta: PaginationMeta;
        }>(`${API.VISITS.LIST}?${params.toString()}`);
        if (cancelled) return;
        setVisits(data.data);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, dateFilter, page]);

  return {
    visits,
    meta,
    isLoading,
    error,
    statusFilter,
    setStatusFilter: (v) => {
      setStatusFilter(v);
      setPage(1);
    },
    dateFilter,
    setDateFilter: (d) => {
      setDateFilter(d);
      setPage(1);
    },
    page,
    setPage,
  };
}
