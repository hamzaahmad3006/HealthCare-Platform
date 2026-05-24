import clsx from 'clsx';
import { FileText, Download, ExternalLink, FlaskConical, Pill, ClipboardList, ImageIcon, File } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Badge } from '../../../constant/Badge';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { useReports } from '../Reports/useReports';
import type { Report, ReportType } from '../../../types/report.types';

const TYPE_OPTIONS: { id: ReportType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'LAB_RESULT', label: 'Lab Results' },
  { id: 'PRESCRIPTION', label: 'Prescriptions' },
  { id: 'VISIT_NOTE', label: 'Visit Notes' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Images' },
];

const TYPE_ICON: Record<ReportType, JSX.Element> = {
  LAB_RESULT: <FlaskConical className="h-5 w-5" />,
  PRESCRIPTION: <Pill className="h-5 w-5" />,
  VISIT_NOTE: <ClipboardList className="h-5 w-5" />,
  PROGRESS_IMAGE: <ImageIcon className="h-5 w-5" />,
  OTHER: <File className="h-5 w-5" />,
};

const TYPE_TONE: Record<ReportType, 'brand' | 'accent' | 'info' | 'success' | 'neutral'> = {
  LAB_RESULT: 'info',
  PRESCRIPTION: 'brand',
  VISIT_NOTE: 'success',
  PROGRESS_IMAGE: 'accent',
  OTHER: 'neutral',
};

const TYPE_BG: Record<ReportType, string> = {
  LAB_RESULT: 'bg-sky-50 text-sky-600',
  PRESCRIPTION: 'bg-brand-50 text-brand-600',
  VISIT_NOTE: 'bg-success-50 text-success-600',
  PROGRESS_IMAGE: 'bg-accent-50 text-accent-600',
  OTHER: 'bg-ink-100 text-ink-500',
};

async function downloadFile(url: string, filename: string): Promise<void> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Download failed');
  const blob = await resp.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(blobUrl);
}

export function StaffReports(): JSX.Element {
  const r = useReports();

  return (
    <SidebarLayout title="My Reports" description="Reports you have uploaded for your patients">
      {/* Type filter */}
      <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-1.5 inline-flex flex-wrap gap-1 shadow-card mb-6">
        {TYPE_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => r.setTypeFilter(f.id)}
            className={clsx(
              'px-4 py-2 text-sm font-semibold rounded-xl transition-all',
              r.typeFilter === f.id
                ? 'bg-gradient-brand text-white shadow-brand'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {r.error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {r.error}
        </div>
      ) : null}

      {r.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-ink-100 animate-pulse" />
          ))}
        </div>
      ) : r.reports.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No reports yet"
          description="Reports you upload during visits will appear here."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {r.reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
          {r.meta ? (
            <div className="mt-6">
              <Pagination meta={r.meta} onPageChange={r.setPage} />
            </div>
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}

function ReportCard({ report }: { report: Report }): JSX.Element {
  const firstFile = report.files?.[0];
  const isImage = firstFile?.mimeType.startsWith('image/');

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden flex flex-col animate-slide-up">
      {isImage && firstFile ? (
        <div className="h-36 bg-ink-100 overflow-hidden">
          <img src={firstFile.fileUrl} alt={report.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={clsx('h-36 flex items-center justify-center', TYPE_BG[report.reportType])}>
          <div className="opacity-30">{TYPE_ICON[report.reportType]}</div>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-semibold text-ink-900 line-clamp-2 leading-snug">{report.title}</p>
            <Badge tone={TYPE_TONE[report.reportType]} size="sm" className="flex-shrink-0">
              {report.reportType.replace(/_/g, ' ')}
            </Badge>
          </div>
          {report.notes ? (
            <p className="text-xs text-ink-500 line-clamp-2">{report.notes}</p>
          ) : null}
        </div>

        <div className="text-xs text-ink-500 space-y-0.5 mt-auto">
          {report.patient ? (
            <p><span className="font-medium text-ink-700">Patient:</span> {report.patient.fullName}</p>
          ) : null}
          {report.booking ? (
            <p className="font-mono text-ink-400">{report.booking.bookingNumber}</p>
          ) : null}
          <p>{formatDateTime(report.createdAt)}</p>
        </div>

        {firstFile ? (
          <div className="flex gap-2 pt-1 border-t border-ink-100">
            <a
              href={firstFile.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 text-xs font-semibold text-ink-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </a>
            <button
              type="button"
              onClick={() => void downloadFile(firstFile.fileUrl, report.title)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-xs font-semibold text-brand-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-400 text-center pt-1 border-t border-ink-100">No file attached</p>
        )}
      </div>
    </Card>
  );
}
