import { useEffect, useState } from 'react';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Report, ReportType } from '../../../types/report.types';
import type { PaginationMeta } from '../../../types/api.types';

export type ReportFilter = ReportType | 'ALL';

export function useMyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ReportFilter>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '12' });
        if (typeFilter !== 'ALL') params.set('reportType', typeFilter);
        const { data } = await api.get<{
          success: true;
          data: Report[];
          meta: PaginationMeta;
        }>(`${API.REPORTS.LIST}?${params.toString()}`);
        if (cancelled) return;
        setReports(data.data);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [typeFilter, page]);

  return {
    reports,
    meta,
    isLoading,
    error,
    typeFilter,
    setTypeFilter: (t: ReportFilter) => { setTypeFilter(t); setPage(1); },
    page,
    setPage,
  };
}
