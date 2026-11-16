import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { DashboardSummary } from '../../../types/admin.types';
import type { Booking } from '../../../types/booking.types';

export interface RecentBooking extends Booking {
  patient?: { fullName: string };
  serviceType?: { name: string };
  package?: { name: string };
}

export interface UseAdminDashboardReturn {
  summary: DashboardSummary | null;
  recentBookings: RecentBooking[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  openBooking: (id: string) => void;
  refresh: () => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isManualRefresh = false): Promise<void> => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [summaryRes, recentRes] = await Promise.all([
        api.get<{ success: true; data: DashboardSummary }>(API.ADMIN.DASHBOARD),
        api.get<{ success: true; data: RecentBooking[] }>(`${API.BOOKINGS.LIST}?page=1&limit=7`),
      ]);
      setSummary(summaryRes.data.data);
      setRecentBookings(recentRes.data.data);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [summaryRes, recentRes] = await Promise.all([
          api.get<{ success: true; data: DashboardSummary }>(API.ADMIN.DASHBOARD),
          api.get<{ success: true; data: RecentBooking[] }>(`${API.BOOKINGS.LIST}?page=1&limit=7`),
        ]);
        if (cancelled) return;
        setSummary(summaryRes.data.data);
        setRecentBookings(recentRes.data.data);
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
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchData(true);
  }, [fetchData]);

  return {
    summary,
    recentBookings,
    isLoading,
    isRefreshing,
    error,
    openBooking: (id) => navigate(`/admin/bookings/${id}`),
    refresh,
  };
}
