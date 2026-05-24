import { useCallback, useEffect, useState } from 'react';
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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

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

  const canCancel = Boolean(
    booking && ['PENDING', 'CONFIRMED'].includes(booking.status),
  );

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
    isSubmittingReview,
    handleReview,
    goBack: () => navigate('/my-bookings'),
  };
}
