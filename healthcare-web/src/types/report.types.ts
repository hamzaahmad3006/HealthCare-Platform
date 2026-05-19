export type ReportType =
  | 'LAB_RESULT'
  | 'PRESCRIPTION'
  | 'VISIT_NOTE'
  | 'PROGRESS_IMAGE'
  | 'OTHER';

export interface ReportFile {
  id: string;
  reportId: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: string;
  uploadedAt: string;
}

export interface Report {
  id: string;
  bookingId: string;
  bookingVisitId: string | null;
  patientId: string;
  uploadedByUserId: string;
  reportType: ReportType;
  title: string;
  notes: string | null;
  isVisibleToCustomer: boolean;
  createdAt: string;
  files?: ReportFile[];
}
