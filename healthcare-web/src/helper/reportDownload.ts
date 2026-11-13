import { api } from './axios';
import { API } from '../constant/apiUrls';
import type { Report, ReportFile } from '../types/report.types';

export async function downloadReportFile(report: Report, file: ReportFile): Promise<void> {
  const { data } = await api.get<Blob>(API.REPORTS.DOWNLOAD_FILE(report.id, file.id), { responseType: 'blob' });
  const suffix = file.mimeType === 'application/pdf' ? 'pdf' : file.mimeType === 'image/png' ? 'png' : file.mimeType === 'image/jpeg' ? 'jpg' : 'bin';
  const safeTitle = report.title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'report';
  const objectUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${safeTitle}.${suffix}`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
