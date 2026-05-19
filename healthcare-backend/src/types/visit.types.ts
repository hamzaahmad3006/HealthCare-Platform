import { VisitStatus } from '@prisma/client';

export interface CheckInRequest {
  checkInLatitude: number;
  checkInLongitude: number;
  beforeConditionText?: string;
}

export interface CheckOutRequest {
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  visitNotes?: string;
  afterConditionText?: string;
}

export interface CompleteVisitRequest {
  visitNotes?: string;
  afterConditionText?: string;
}

export interface MissVisitRequest {
  reason: string;
}

export interface CancelVisitRequest {
  reason: string;
}

export interface VisitListQuery {
  status?: VisitStatus;
  staffUserId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
