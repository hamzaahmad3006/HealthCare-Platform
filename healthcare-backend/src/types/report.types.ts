import { ReportType, FileProvider } from '@prisma/client';

export interface CreateReportRequest {
  bookingId: string;
  bookingVisitId?: string;
  patientId: string;
  reportType: ReportType;
  title: string;
  notes?: string;
  isVisibleToCustomer?: boolean;
}

export interface UpdateReportRequest {
  title?: string;
  notes?: string;
  isVisibleToCustomer?: boolean;
}

export interface PresignReportFileRequest {
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignReportFileResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export interface ConfirmReportFileRequest {
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256?: string;
}

export interface ReportFileResponse {
  id: string;
  reportId: string;
  fileProvider: FileProvider;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: string;
  checksumSha256: string | null;
  uploadedAt: Date;
}

export interface ReportListQuery {
  patientId?: string;
  bookingId?: string;
  reportType?: ReportType;
  page?: number;
  limit?: number;
}
