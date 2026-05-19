import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentIntentRequest {
  bookingId: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
}

export interface PaymentResponse {
  id: string;
  bookingId: string;
  stripePaymentIntentId: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt: Date | null;
  refundedAt: Date | null;
  refundReason: string | null;
  createdAt: Date;
}

export interface RefundRequest {
  reason: string;
}
