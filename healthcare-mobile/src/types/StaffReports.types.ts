import type { ReportType } from './report.types';

export type { ReportType };

export interface StaffReport {
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

export interface ApiStaffReport {
  id: string;
  title: string;
  reportType: ReportType;
  notes?: string | null;
  createdAt: string;
  patient?: { fullName: string } | null;
  booking?: { bookingNumber: string } | null;
  files?: { fileUrl: string }[];
}
