export type ReportType = 'LAB_RESULT' | 'PRESCRIPTION' | 'VISIT_NOTE' | 'PROGRESS_IMAGE' | 'OTHER';

export interface Report {
  id: string;
  title: string;
  reportType: ReportType;
  notes?: string;
  patientName?: string;
  bookingNumber?: string;
  createdAt: string;
  hasFile: boolean;
  fileUrl?: string;
}

export interface ApiReport {
  id: string;
  title: string;
  reportType: ReportType;
  notes?: string | null;
  createdAt: string;
  patient?: { fullName: string } | null;
  booking?: { bookingNumber: string } | null;
  files?: { fileUrl: string }[];
}
