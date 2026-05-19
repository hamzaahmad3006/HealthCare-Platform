import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { setActiveTab, setPage } from '../../../redux/slices/bookingSlice';
import type { Booking, BookingStatus } from '../../../types/booking.types';
import type { PaginationMeta } from '../../../types/api.types';
import type { StaffWithRelations } from '../../../types/staff.types';

interface AdminBookingRow extends Booking {
  patient?: { fullName: string };
  serviceType?: { code: string; name: string };
  package?: { name: string };
}

interface UseBookingsReturn {
  bookings: AdminBookingRow[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  activeTab: BookingStatus | 'ALL';
  setTab: (t: BookingStatus | 'ALL') => void;
  page: number;
  setPageNum: (p: number) => void;

  // Confirm
  confirmingId: string | null;
  handleConfirm: (id: string) => Promise<void>;

  // Assign panel
  assignPanelOpen: boolean;
  assignBookingId: string | null;
  assignVisitId: string | null;
  openAssignPanel: (bookingId: string, visitId: string, cityId: string, serviceTypeId: string) => Promise<void>;
  closeAssignPanel: () => void;
  eligibleStaff: StaffWithRelations[];
  loadingStaff: boolean;
  assigningStaffId: string | null;
  handleAssign: (staffUserId: string) => Promise<void>;

  // Row navigation
  openBooking: (id: string) => void;
}

export function useBookings(): UseBookingsReturn {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { activeTab, page } = useAppSelector((s) => s.booking);

  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  // Assign panel state
  const [assignPanelOpen, setAssignPanelOpen] = useState(false);
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null);
  const [assignVisitId, setAssignVisitId] = useState<string | null>(null);
  const [eligibleStaff, setEligibleStaff] = useState<StaffWithRelations[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);

  // ── Fetch bookings ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetch = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const query = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
        const { data } = await api.get<{
          success: true;
          data: AdminBookingRow[];
          meta: PaginationMeta;
        }>(`${API.BOOKINGS.LIST}?page=${page}&limit=20${query}`);
        if (cancelled) return;
        setBookings(data.data);
        setMeta(data.meta);
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
  }, [activeTab, page, reloadFlag]);

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async (id: string): Promise<void> => {
    setConfirmingId(id);
    try {
      await api.patch(API.BOOKINGS.CONFIRM(id));
      toast.success('Booking confirmed');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setConfirmingId(null);
    }
  }, []);

  // ── Assign flow ────────────────────────────────────────────────────────────
  const openAssignPanel = useCallback(
    async (bookingId: string, visitId: string, cityId: string, serviceTypeId: string): Promise<void> => {
      setAssignBookingId(bookingId);
      setAssignVisitId(visitId);
      setAssignPanelOpen(true);
      setLoadingStaff(true);
      try {
        const { data } = await api.get<{ success: true; data: StaffWithRelations[] }>(
          `${API.STAFF.LIST}?cityId=${cityId}&serviceTypeId=${serviceTypeId}&isAvailable=true&verificationStatus=VERIFIED&limit=50`,
        );
        setEligibleStaff(data.data);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setLoadingStaff(false);
      }
    },
    [],
  );

  const closeAssignPanel = useCallback((): void => {
    setAssignPanelOpen(false);
    setAssignBookingId(null);
    setAssignVisitId(null);
    setEligibleStaff([]);
  }, []);

  const handleAssign = useCallback(
    async (staffUserId: string): Promise<void> => {
      if (!assignBookingId || !assignVisitId) return;
      setAssigningStaffId(staffUserId);
      try {
        await api.post(API.BOOKINGS.ASSIGN(assignBookingId), {
          visitId: assignVisitId,
          staffUserId,
        });
        toast.success('Staff assigned');
        closeAssignPanel();
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setAssigningStaffId(null);
      }
    },
    [assignBookingId, assignVisitId, closeAssignPanel],
  );

  return {
    bookings,
    meta,
    isLoading,
    error,
    activeTab,
    setTab: (t) => dispatch(setActiveTab(t)),
    page,
    setPageNum: (p) => dispatch(setPage(p)),
    confirmingId,
    handleConfirm,
    assignPanelOpen,
    assignBookingId,
    assignVisitId,
    openAssignPanel,
    closeAssignPanel,
    eligibleStaff,
    loadingStaff,
    assigningStaffId,
    handleAssign,
    openBooking: (id) => navigate(`/admin/bookings/${id}`),
  };
}
