import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { DashboardSummary } from '../../../types/admin.types';
import type { Booking } from '../../../types/booking.types';

interface RecentBooking extends Booking {
  patient?: { fullName: string };
  serviceType?: { name: string };
  package?: { name: string };
}

interface UseAdminDashboardReturn {
  summary: DashboardSummary | null;
  recentBookings: RecentBooking[];
  isLoading: boolean;
  error: string | null;
  openBooking: (id: string) => void;
}

export function useAdminDashboard(): UseAdminDashboardReturn {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [summaryRes, recentRes] = await Promise.all([
          api.get<{ success: true; data: DashboardSummary }>(API.ADMIN.DASHBOARD),
          api.get<{ success: true; data: RecentBooking[] }>(`${API.BOOKINGS.LIST}?page=1&limit=5`),
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

  return {
    summary,
    recentBookings,
    isLoading,
    error,
    openBooking: (id) => navigate(`/admin/bookings/${id}`),
  };
}
