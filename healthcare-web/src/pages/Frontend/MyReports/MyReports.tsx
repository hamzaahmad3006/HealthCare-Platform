import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { downloadReportFile } from '../../../helper/reportDownload';
import clsx from 'clsx';
import {
  FileText,
  Download,
  ExternalLink,
  FlaskConical,
  Pill,
  ClipboardList,
  ImageIcon,
  File,
  Search,
  Sparkles,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react';
import { TopNav } from '../../../component/common/TopNav';
import { Pagination } from '../../../component/common/Pagination';
import { Badge } from '../../../constant/Badge';
import { Card } from '../../../constant/Card';
import { ReportCardSkeleton } from '../../../component/common/Skeleton';
import { formatDateTime } from '../../../helper/format';
import { useMyReports, type ReportFilter } from './useMyReports';
import type { Report, ReportType } from '../../../types/report.types';

const FILTERS: { id: ReportFilter; label: string }[] = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'LAB_RESULT', label: 'Lab Results' },
  { id: 'PRESCRIPTION', label: 'Prescriptions' },
  { id: 'VISIT_NOTE', label: 'Visit Notes' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Images' },
];

const TYPE_ICON: Record<ReportType, JSX.Element> = {
  LAB_RESULT: <FlaskConical className="h-6 w-6" />,
  PRESCRIPTION: <Pill className="h-6 w-6" />,
  VISIT_NOTE: <ClipboardList className="h-6 w-6" />,
  PROGRESS_IMAGE: <ImageIcon className="h-6 w-6" />,
  OTHER: <File className="h-6 w-6" />,
};

const TYPE_TONE: Record<ReportType, 'brand' | 'accent' | 'info' | 'success' | 'neutral'> = {
  LAB_RESULT: 'info',
  PRESCRIPTION: 'brand',
  VISIT_NOTE: 'success',
  PROGRESS_IMAGE: 'accent',
  OTHER: 'neutral',
};

const TYPE_BG: Record<ReportType, string> = {
  LAB_RESULT: 'from-sky-50 to-blue-100/50 text-sky-600',
  PRESCRIPTION: 'from-brand-50 to-emerald-100/50 text-brand-600',
  VISIT_NOTE: 'from-emerald-50 to-teal-100/50 text-emerald-600',
  PROGRESS_IMAGE: 'from-amber-50 to-orange-100/50 text-amber-600',
  OTHER: 'from-ink-50 to-ink-100 text-ink-500',
};

export function MyReports(): JSX.Element {
  const r = useMyReports();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return r.reports;
    const q = searchQuery.toLowerCase().trim();
    return r.reports.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.notes ?? '').toLowerCase().includes(q) ||
        (item.patient?.fullName ?? '').toLowerCase().includes(q) ||
        (item.booking?.bookingNumber ?? '').toLowerCase().includes(q)
      );
    });
  }, [r.reports, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 via-white to-ink-50">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* ── Hero Medical Vault Banner ──────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-teal-700 text-white p-6 sm:p-8 shadow-xl shadow-brand-900/10 animate-slide-up">
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-emerald-50 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                Digital Health Vault · Encrypted Medical Records
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                My Medical Reports
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                View and download diagnostic lab results, doctor prescriptions, and clinical visit notes uploaded by your care team.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 px-5 py-3.5 text-center">
                <p className="text-2xl font-black text-white">{r.meta?.total ?? r.reports.length}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Total Documents</p>
              </div>
              <Link
                to="/book?service=LAB_SAMPLING"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-brand-800 font-bold text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 hover:-translate-y-0.5 transition-all"
              >
                <FlaskConical className="h-4 w-4" />
                Book Lab Sampling
              </Link>
            </div>
          </div>
        </section>

        {/* ── Filter & Search Bar ────────────────────────────────────── */}
        <section className="rounded-2xl bg-white border border-ink-100 shadow-2xs p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => r.setTypeFilter(f.id)}
                className={clsx(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all',
                  r.typeFilter === f.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="h-3.5 w-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, patient, booking #…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-ink-50 border border-ink-200/80 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={r.retry}
              className="p-2 rounded-xl bg-ink-50 border border-ink-200/80 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
              title="Refresh reports"
              aria-label="Refresh reports"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>

        {/* Error */}
        {r.error ? (
          <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
            {r.error}
            <button type="button" onClick={r.retry} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        ) : null}

        {/* Content */}
        {r.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        ) : r.error ? null : filteredReports.length === 0 ? (
          <div className="rounded-3xl bg-white border border-dashed border-brand-200 p-10 text-center shadow-2xs">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">
              {searchQuery.trim() ? 'No matching reports found' : 'No medical reports yet'}
            </h3>
            <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
              {searchQuery.trim()
                ? 'Try clearing your search or switching the document category.'
                : 'Reports and prescriptions uploaded by your healthcare staff will appear here automatically after each visit.'}
            </p>
            <div className="mt-5">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <CalendarPlus className="h-4 w-4" />
                Book a Visit
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredReports.map((report) => (
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
      </main>
    </div>
  );
}

function ReportCard({ report }: { report: Report }): JSX.Element {
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = async (): Promise<void> => {
    const file = report.files?.[0];
    if (!file || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadReportFile(report, file);
    } catch {
      toast.error('Could not download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  const firstFile = report.files?.[0];
  const isImage = firstFile?.mimeType.startsWith('image/');

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden flex flex-col rounded-3xl border border-ink-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 animate-slide-up"
    >
      {/* Preview area */}
      {isImage && firstFile ? (
        <div className="h-36 bg-ink-100 overflow-hidden">
          <img
            src={firstFile.fileUrl}
            alt={report.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={clsx('h-32 bg-gradient-to-br flex items-center justify-center', TYPE_BG[report.reportType])}>
          <div className="h-12 w-12 rounded-2xl bg-white/80 backdrop-blur-xs shadow-sm flex items-center justify-center">
            {TYPE_ICON[report.reportType]}
          </div>
          <span className="sr-only">{report.reportType}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-bold text-ink-900 line-clamp-2 leading-snug">{report.title}</p>
            <Badge tone={TYPE_TONE[report.reportType]} size="sm" className="flex-shrink-0">
              {report.reportType.replace(/_/g, ' ')}
            </Badge>
          </div>
          {report.notes ? (
            <p className="text-xs text-ink-500 line-clamp-2">{report.notes}</p>
          ) : null}
        </div>

        <div className="rounded-xl bg-ink-50/70 border border-ink-100 p-3 text-xs text-ink-500 space-y-1 mt-auto">
          {report.patient ? (
            <p className="flex items-center justify-between gap-2">
              <span className="text-ink-400">Patient:</span>
              <span className="font-semibold text-ink-800 truncate">{report.patient.fullName}</span>
            </p>
          ) : null}
          {report.booking ? (
            <p className="flex items-center justify-between gap-2">
              <span className="text-ink-400">Booking:</span>
              <span className="font-mono font-medium text-ink-700">{report.booking.bookingNumber}</span>
            </p>
          ) : null}
          <p className="flex items-center justify-between gap-2">
            <span className="text-ink-400">Uploaded:</span>
            <span className="text-ink-600">{formatDateTime(report.createdAt)}</span>
          </p>
        </div>

        {/* Actions */}
        {firstFile ? (
          <div className="flex gap-2 pt-1">
            <a
              href={firstFile.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl ring-1 ring-ink-200 hover:bg-ink-50 text-xs font-semibold text-ink-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </a>
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-600 text-xs font-bold text-brand-700 hover:text-white border border-brand-200/80 hover:border-brand-600 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              {isDownloading ? 'Saving…' : 'Download'}
            </button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
