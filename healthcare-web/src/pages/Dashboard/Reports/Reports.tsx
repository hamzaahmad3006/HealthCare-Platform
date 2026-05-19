import { FileText, Download } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Badge } from '../../../constant/Badge';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { useReports } from './useReports';
import type { Report, ReportType } from '../../../types/report.types';

const TYPE_OPTIONS: { id: ReportType | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'LAB_RESULT', label: 'Lab Result' },
  { id: 'PRESCRIPTION', label: 'Prescription' },
  { id: 'VISIT_NOTE', label: 'Visit Note' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Image' },
];

const TYPE_TONE: Record<ReportType, 'brand' | 'accent' | 'info' | 'success' | 'neutral'> = {
  LAB_RESULT: 'info',
  PRESCRIPTION: 'brand',
  VISIT_NOTE: 'success',
  PROGRESS_IMAGE: 'accent',
  OTHER: 'neutral',
};

export function Reports(): JSX.Element {
  const r = useReports();

  const columns: ColumnDef<Report>[] = [
    {
      key: 'title',
      header: 'Report',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{row.title}</p>
            {row.notes ? (
              <p className="text-xs text-ink-500 mt-0.5 line-clamp-1 max-w-md">{row.notes}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={TYPE_TONE[row.reportType]} size="sm">
          {row.reportType.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'visibility',
      header: 'Customer visible',
      render: (row) => (
        <Badge tone={row.isVisibleToCustomer ? 'success' : 'neutral'} dot>
          {row.isVisibleToCustomer ? 'Visible' : 'Hidden'}
        </Badge>
      ),
    },
    {
      key: 'created',
      header: 'Uploaded',
      render: (row) => <span className="text-ink-700 text-sm">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'files',
      header: 'Files',
      align: 'right',
      render: (row) =>
        row.files && row.files.length > 0 ? (
          <div className="inline-flex items-center gap-1 text-sm text-ink-700">
            <FileText className="h-3.5 w-3.5" />
            {row.files.length}
          </div>
        ) : (
          <span className="text-ink-400 text-sm">0</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) =>
        row.files && row.files[0] ? (
          <a
            href={row.files[0].fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 text-xs font-semibold text-ink-700"
          >
            <Download className="h-3.5 w-3.5" />
            View
          </a>
        ) : null,
    },
  ];

  return (
    <SidebarLayout title="Reports" description="Medical reports across all patients">
      <div>
        <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
          Type
        </label>
        <div className="bg-white rounded-xl ring-1 ring-ink-200 p-1 inline-flex gap-1 flex-wrap">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => r.setTypeFilter(o.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                r.typeFilter === o.id ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {r.error ? (
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {r.error}
        </div>
      ) : null}

      <Card padding="none" className="mt-6 overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={r.reports}
          rowKey={(row) => row.id}
          isLoading={r.isLoading}
          emptyState={
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No reports yet"
              description="Reports uploaded by staff or admin will appear here."
            />
          }
        />
        {r.meta ? <Pagination meta={r.meta} onPageChange={r.setPage} /> : null}
      </Card>
    </SidebarLayout>
  );
}
