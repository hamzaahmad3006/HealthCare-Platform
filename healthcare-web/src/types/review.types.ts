export interface Review {
  id: string;
  bookingId: string;
  bookingVisitId: string | null;
  customerUserId: string;
  staffUserId: string | null;
  rating: number;
  reviewText: string | null;
  isLowRating: boolean;
  adminFollowedUp: boolean;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  bookingVisitId?: string;
  staffUserId?: string;
  rating: number;
  reviewText?: string;
}
