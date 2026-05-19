import { useEffect, useState } from 'react';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Review } from '../../../types/review.types';
import type { PaginationMeta } from '../../../types/api.types';

interface UseReviewsReturn {
  reviews: Review[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  onlyLowRating: boolean;
  setOnlyLowRating: (v: boolean) => void;
  page: number;
  setPage: (p: number) => void;
}

export function useReviews(): UseReviewsReturn {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyLowRating, setOnlyLowRating] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (onlyLowRating) params.set('isLowRating', 'true');
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
  }, [onlyLowRating, page]);

  return {
    reviews,
    meta,
    isLoading,
    error,
    onlyLowRating,
    setOnlyLowRating: (v) => {
      setOnlyLowRating(v);
      setPage(1);
    },
    page,
    setPage,
  };
}
