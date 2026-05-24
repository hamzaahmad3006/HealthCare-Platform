import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { BookingWithRelations } from '../../../types/booking.types';
import type { StaffWithRelations } from '../../../types/staff.types';

interface UseAdminBookingDetailReturn {
  bookingId: string | undefined;
  booking: BookingWithRelations | null;
  isLoading: boolean;
  error: string | null;

  isConfirming: boolean;
  handleConfirm: () => Promise<void>;

  isCancelling: boolean;
  handleCancel: (reason: string) => Promise<void>;

  isMarkingPaid: boolean;
  handleMarkPaid: () => Promise<void>;

  // Assign
  assignPanelOpen: boolean;
  loadingStaff: boolean;
  eligibleStaff: StaffWithRelations[];
  assigningStaffId: string | null;
  openAssignPanel: (visitId: string) => Promise<void>;
  closeAssignPanel: () => void;
  handleAssign: (staffUserId: string) => Promise<void>;

  goBack: () => void;
}

export function useAdminBookingDetail(): UseAdminBookingDetailReturn {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const [assignPanelOpen, setAssignPanelOpen] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [eligibleStaff, setEligibleStaff] = useState<StaffWithRelations[]>([]);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);

  // ── Load booking ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const { data } = await api.get<{ success: true; data: BookingWithRelations }>(
          API.BOOKINGS.BY_ID(id),
        );
        if (!cancelled) setBooking(data.data);
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
  }, [id, reloadFlag]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsConfirming(true);
    try {
      await api.patch(API.BOOKINGS.CONFIRM(id));
      toast.success('Booking confirmed');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsConfirming(false);
    }
  }, [id]);

  const handleCancel = useCallback(
    async (reason: string): Promise<void> => {
      if (!id) return;
      setIsCancelling(true);
      try {
        await api.patch(API.BOOKINGS.CANCEL(id), { reason });
        toast.success('Booking cancelled');
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsCancelling(false);
      }
    },
    [id],
  );

  const handleMarkPaid = useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsMarkingPaid(true);
    try {
      await api.patch(API.PAYMENTS.MARK_PAID(id));
      toast.success('Payment marked as collected');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsMarkingPaid(false);
    }
  }, [id]);

  // ── Assign flow ────────────────────────────────────────────────────────────
  const openAssignPanel = useCallback(
    async (visitId: string): Promise<void> => {
      if (!booking) return;
      setActiveVisitId(visitId);
      setAssignPanelOpen(true);
      setLoadingStaff(true);
      try {
        const { data } = await api.get<{ success: true; data: StaffWithRelations[] }>(
          `${API.STAFF.LIST}?cityId=${booking.cityId}&serviceTypeId=${booking.serviceTypeId}&isAvailable=true&verificationStatus=VERIFIED&limit=50`,
        );
        setEligibleStaff(data.data);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setLoadingStaff(false);
      }
    },
    [booking],
  );

  const closeAssignPanel = useCallback((): void => {
    setAssignPanelOpen(false);
    setActiveVisitId(null);
    setEligibleStaff([]);
  }, []);

  const handleAssign = useCallback(
    async (staffUserId: string): Promise<void> => {
      if (!id || !activeVisitId) return;
      setAssigningStaffId(staffUserId);
      try {
        await api.post(API.BOOKINGS.ASSIGN(id), { visitId: activeVisitId, staffUserId });
        toast.success('Staff assigned');
        closeAssignPanel();
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setAssigningStaffId(null);
      }
    },
    [id, activeVisitId, closeAssignPanel],
  );

  return {
    bookingId: id,
    booking,
    isLoading,
    error,
    isConfirming,
    handleConfirm,
    isCancelling,
    handleCancel,
    isMarkingPaid,
    handleMarkPaid,
    assignPanelOpen,
    loadingStaff,
    eligibleStaff,
    assigningStaffId,
    openAssignPanel,
    closeAssignPanel,
    handleAssign,
    goBack: () => navigate('/admin/bookings'),
  };
}
