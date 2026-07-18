export type ReportType = 'LAB_RESULT' | 'PRESCRIPTION' | 'VISIT_NOTE' | 'PROGRESS_IMAGE' | 'OTHER';

// Cloudinary only accepts these three via the backend's PresignSchema.
export const ALLOWED_REPORT_FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export type AllowedReportFileMimeType = (typeof ALLOWED_REPORT_FILE_MIME_TYPES)[number];

export interface PresignResult {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
  uploadParams: {
    api_key: string;
    timestamp: number;
    signature: string;
    public_id: string;
    resource_type: string;
  };
}
