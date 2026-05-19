export interface CreateReviewRequest {
  bookingId: string;
  bookingVisitId?: string;
  staffUserId?: string;
  rating: number;
  reviewText?: string;
}

export interface ReviewListQuery {
  staffUserId?: string;
  bookingId?: string;
  rating?: number;
  isLowRating?: boolean;
  page?: number;
  limit?: number;
}

export interface ReviewResponse {
  id: string;
  bookingId: string;
  bookingVisitId: string | null;
  customerUserId: string;
  staffUserId: string | null;
  rating: number;
  reviewText: string | null;
  isLowRating: boolean;
  adminFollowedUp: boolean;
  createdAt: Date;
}
