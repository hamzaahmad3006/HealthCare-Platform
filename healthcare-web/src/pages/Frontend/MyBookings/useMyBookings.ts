import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Booking, ServiceType } from '../../../types/booking.types';
import type { PaginationMeta } from '../../../types/api.types';

export type MyBookingsTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface BookingListItem extends Booking {
  patient?: { fullName: string };
  serviceType?: { code: string; name: string };
  package?: { name: string };
  address?: { area?: string; line1?: string; city?: { name: string } };
}

export interface CustomerOverviewStats {
  patientsCount: number;
  reportsCount: number;
  completedCount: number;
}

interface UseMyBookingsReturn {
  bookings: BookingListItem[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  activeTab: MyBookingsTab;
  setActiveTab: (t: MyBookingsTab) => void;
  page: number;
  setPage: (p: number) => void;
  retry: () => void;
  handleOpen: (id: string) => void;
  handleNewBooking: () => void;
  handleBookService: (serviceCode: string) => void;
  services: ServiceType[];
  stats: CustomerOverviewStats;
}

const STATUS_GROUPS: Record<MyBookingsTab, string[]> = {
  ACTIVE: [
    'PENDING_DOCTOR',
    'TIME_PROPOSED',
    'PENDING',
    'CONFIRMED',
    'ASSIGNED',
    'IN_PROGRESS',
    'RESCHEDULED',
  ],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
};

export function useMyBookings(): UseMyBookingsReturn {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MyBookingsTab>('ACTIVE');
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [stats, setStats] = useState<CustomerOverviewStats>({
    patientsCount: 0,
    reportsCount: 0,
    completedCount: 0,
  });

  // Load quick-book services and summary KPIs once on mount
  useEffect(() => {
    let cancelled = false;
    const loadOverview = async (): Promise<void> => {
      try {
        const [svcRes, patRes, repRes, compRes] = await Promise.allSettled([
          api.get<{ success: true; data: ServiceType[] }>(API.SERVICE_TYPES),
          api.get<{ success: true; data: unknown[]; meta?: PaginationMeta }>(`${API.USERS.PATIENTS}?limit=1`),
          api.get<{ success: true; data: unknown[]; meta?: PaginationMeta }>(`${API.REPORTS.LIST}?limit=1`),
          api.get<{ success: true; data: unknown[]; meta?: PaginationMeta }>(`${API.BOOKINGS.LIST}?status=COMPLETED&limit=1`),
        ]);
        if (cancelled) return;
        if (svcRes.status === 'fulfilled') {
          setServices(svcRes.value.data.data.filter((s) => s.isActive));
        }
        setStats({
          patientsCount:
            patRes.status === 'fulfilled'
              ? (patRes.value.data.meta?.total ?? patRes.value.data.data.length)
              : 0,
          reportsCount:
            repRes.status === 'fulfilled'
              ? (repRes.value.data.meta?.total ?? repRes.value.data.data.length)
              : 0,
          completedCount:
            compRes.status === 'fulfilled'
              ? (compRes.value.data.meta?.total ?? compRes.value.data.data.length)
              : 0,
        });
      } catch {
        // Non-critical overview data
      }
    };
    void loadOverview();
    return () => {
      cancelled = true;
    };
  }, [reloadFlag]);

  useEffect(() => {
    let cancelled = false;
    const fetchBookings = async (silent: boolean): Promise<void> => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const statuses = STATUS_GROUPS[activeTab];
        const results = await Promise.all(
          statuses.map((status) =>
            api.get<{ success: true; data: BookingListItem[]; meta: PaginationMeta }>(
              `${API.BOOKINGS.LIST}?status=${status}&page=${page}&limit=20`,
            ),
          ),
        );
        if (cancelled) return;
        const all: BookingListItem[] = results.flatMap((r) => r.data.data);
        const totalCount = results.reduce((sum, r) => sum + (r.data.meta?.total ?? 0), 0);
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(all);
        setMeta({
          total: totalCount,
          page,
          limit: 20,
          hasNext: results.some((r) => r.data.meta?.hasNext === true),
        });
        if (silent) setError(null);
      } catch (err) {
        if (!cancelled && !silent) setError(extractApiError(err).message);
      } finally {
        if (!cancelled && !silent) setIsLoading(false);
      }
    };

    void fetchBookings(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchBookings(true);
      }
    }, 6_000);

    const handleFocus = (): void => {
      if (document.visibilityState === 'visible') {
        void fetchBookings(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activeTab, page, reloadFlag]);

  const handleOpen = useCallback(
    (id: string): void => {
      navigate(`/my-bookings/${id}`);
    },
    [navigate],
  );

  const handleNewBooking = useCallback((): void => {
    navigate('/book');
  }, [navigate]);

  const handleBookService = useCallback(
    (serviceCode: string): void => {
      navigate(`/book?service=${encodeURIComponent(serviceCode)}`);
    },
    [navigate],
  );

  return {
    bookings,
    meta,
    isLoading,
    error,
    activeTab,
    setActiveTab: (t) => {
      setActiveTab(t);
      setPage(1);
    },
    page,
    setPage,
    retry: () => setReloadFlag((f) => f + 1),
    handleOpen,
    handleNewBooking,
    handleBookService,
    services,
    stats,
  };
}
