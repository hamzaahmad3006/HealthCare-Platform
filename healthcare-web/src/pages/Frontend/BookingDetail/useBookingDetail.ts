import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { BookingWithRelations } from '../../../types/booking.types';

export interface ReviewFormData {
  rating: number;
  reviewText?: string;
}

interface UseBookingDetailReturn {
  bookingId: string | undefined;
  booking: BookingWithRelations | null;
  isLoading: boolean;
  error: string | null;
  isCancelling: boolean;
  canCancel: boolean;
  handleCancel: (reason: string) => Promise<void>;
  isRescheduling: boolean;
  canReschedule: boolean;
  handleReschedule: (newStartAt: string) => Promise<boolean>;
  isActingOnTime: boolean;
  handleAcceptTime: () => Promise<void>;
  handleDeclineTime: () => Promise<void>;
  isSubmittingReview: boolean;
  handleReview: (data: ReviewFormData) => Promise<void>;
  goBack: () => void;
}

export function useBookingDetail(): UseBookingDetailReturn {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isActingOnTime, setIsActingOnTime] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchBooking = async (silent: boolean): Promise<void> => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      try {
        const { data } = await api.get<{ success: true; data: BookingWithRelations }>(
          API.BOOKINGS.BY_ID(id),
        );
        if (cancelled) return;
        const nextBooking = data.data;
        const visitSig = (nextBooking.visits ?? []).map((v) => `${v.id}:${v.status}:${v.checkInAt ?? ''}:${v.checkOutAt ?? ''}`).join('|');
        const nextSig = `${nextBooking.status}::${visitSig}`;
        if (silent && prevStatusRef.current && prevStatusRef.current !== nextSig) {
          const prevBookingStatus = prevStatusRef.current.split('::')[0];
          if (prevBookingStatus !== nextBooking.status) {
            toast.success(`Live update: Booking is now ${nextBooking.status.replace(/_/g, ' ').toLowerCase()}`);
          } else {
            const latestVisit = nextBooking.visits?.[0];
            if (latestVisit) {
              toast.success(`Live update: Visit #${latestVisit.sequenceNo} is ${latestVisit.status.replace(/_/g, ' ').toLowerCase()}`);
            }
          }
        }
        prevStatusRef.current = nextSig;
        setBooking(nextBooking);
        if (silent) setError(null);
      } catch (err) {
        if (!cancelled && !silent) setError(extractApiError(err).message);
      } finally {
        if (!cancelled && !silent) setIsLoading(false);
      }
    };

    void fetchBooking(false);

    // Real-time background polling + instant refresh on tab focus / visibility change
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchBooking(true);
      }
    }, 5_000);

    const handleFocus = (): void => {
      if (document.visibilityState === 'visible') {
        void fetchBooking(true);
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
  }, [id, reloadFlag]);

  const canCancel = Boolean(
    booking && ['PENDING', 'CONFIRMED', 'RESCHEDULED', 'PENDING_DOCTOR', 'TIME_PROPOSED'].includes(booking.status),
  );
  const canReschedule = Boolean(booking?.canReschedule);

  const handleCancel = useCallback(
    async (reason: string): Promise<void> => {
      if (!id) return;
      setIsCancelling(true);
      try {
        await api.patch(API.BOOKINGS.CANCEL(id), { reason });
        toast.success('Booking cancelled.');
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsCancelling(false);
      }
    },
    [id],
  );

  const handleReschedule = useCallback(
    async (newStartAt: string): Promise<boolean> => {
      if (!id) return false;
      setIsRescheduling(true);
      try {
        await api.patch(API.BOOKINGS.RESCHEDULE(id), { requestedStartAt: newStartAt });
        toast.success('New schedule submitted for admin confirmation.');
        setReloadFlag((f) => f + 1);
        return true;
      } catch (err) {
        toast.error(extractApiError(err).message);
        return false;
      } finally {
        setIsRescheduling(false);
      }
    },
    [id],
  );

  const handleAcceptTime = useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsActingOnTime(true);
    try {
      await api.patch(API.BOOKINGS.CUSTOMER_ACCEPT_TIME(id));
      toast.success('Time accepted — booking confirmed with doctor!');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsActingOnTime(false);
    }
  }, [id]);

  const handleDeclineTime = useCallback(async (): Promise<void> => {
    if (!id) return;
    setIsActingOnTime(true);
    try {
      await api.patch(API.BOOKINGS.CUSTOMER_DECLINE_TIME(id));
      toast.success('Booking cancelled.');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsActingOnTime(false);
    }
  }, [id]);

  const handleReview = useCallback(
    async (data: ReviewFormData): Promise<void> => {
      if (!id) return;
      setIsSubmittingReview(true);
      try {
        await api.post(API.REVIEWS, { bookingId: id, ...data });
        toast.success('Review submitted — thank you!');
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [id],
  );

  return {
    bookingId: id,
    booking,
    isLoading,
    error,
    isCancelling,
    canCancel,
    handleCancel,
    isRescheduling,
    canReschedule,
    handleReschedule,
    isActingOnTime,
    handleAcceptTime,
    handleDeclineTime,
    isSubmittingReview,
    handleReview,
    goBack: () => navigate('/my-bookings'),
  };
}
