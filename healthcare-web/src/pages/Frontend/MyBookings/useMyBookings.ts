import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Booking } from '../../../types/booking.types';
import type { PaginationMeta } from '../../../types/api.types';

export type MyBookingsTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface BookingListItem extends Booking {
  patient?: { fullName: string };
  serviceType?: { code: string; name: string };
  package?: { name: string };
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
  handleOpen: (id: string) => void;
  handleNewBooking: () => void;
}

const STATUS_GROUPS: Record<MyBookingsTab, string[]> = {
  ACTIVE: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'RESCHEDULED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
};

export function useMyBookings(): UseMyBookingsReturn {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MyBookingsTab>('ACTIVE');
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const statuses = STATUS_GROUPS[activeTab];
        // Backend filter accepts a single status; we fetch per-status and merge in client.
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
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetch();
    return () => {
      cancelled = true;
    };
  }, [activeTab, page]);

  const handleOpen = useCallback(
    (id: string): void => {
      navigate(`/my-bookings/${id}`);
    },
    [navigate],
  );

  const handleNewBooking = useCallback((): void => {
    navigate('/book');
  }, [navigate]);

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
    handleOpen,
    handleNewBooking,
  };
}
