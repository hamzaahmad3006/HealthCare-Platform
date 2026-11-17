import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Review } from '../../../types/review.types';
import type { PaginationMeta } from '../../../types/api.types';

export interface UseReviewsReturn {
  reviews: Review[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  onlyLowRating: boolean;
  setOnlyLowRating: (v: boolean) => void;
  ratingFilter: number | null;
  setRatingFilter: (r: number | null) => void;
  page: number;
  setPage: (p: number) => void;
  toggleFollowUp: (reviewId: string) => Promise<boolean>;
  togglingId: string | null;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyLowRating, setOnlyLowRating] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (onlyLowRating) params.set('isLowRating', 'true');
        if (ratingFilter !== null) params.set('rating', String(ratingFilter));
        const { data } = await api.get<{
          success: true;
          data: Review[];
          meta: PaginationMeta;
        }>(`${API.REVIEWS}?${params.toString()}`);
        if (cancelled) return;
        setReviews(data.data);
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
  }, [onlyLowRating, ratingFilter, page, reloadFlag]);

  const toggleFollowUp = useCallback(async (reviewId: string): Promise<boolean> => {
    setTogglingId(reviewId);
    try {
      const { data } = await api.patch<{
        success: true;
        data: Review;
      }>(`${API.REVIEWS}/${reviewId}/resolve`);
      
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, adminFollowedUp: data.data.adminFollowedUp } : r)),
      );
      toast.success(
        data.data.adminFollowedUp ? 'Feedback marked as resolved' : 'Feedback re-opened for follow-up',
      );
      return true;
    } catch (err) {
      toast.error(extractApiError(err).message || 'Failed to update follow-up status');
      return false;
    } finally {
      setTogglingId(null);
    }
  }, []);

  return {
    reviews,
    meta,
    isLoading,
    error,
    retry: () => setReloadFlag((f) => f + 1),
    onlyLowRating,
    setOnlyLowRating: (v) => {
      setOnlyLowRating(v);
      if (v) setRatingFilter(null);
      setPage(1);
    },
    ratingFilter,
    setRatingFilter: (r) => {
      setRatingFilter(r);
      if (r !== null) setOnlyLowRating(false);
      setPage(1);
    },
    page,
    setPage,
    toggleFollowUp,
    togglingId,
  };
}
