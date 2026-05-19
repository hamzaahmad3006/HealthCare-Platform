import { Calendar } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime, formatTime } from '../../../helper/format';
import { useVisits } from './useVisits';
import type { BookingVisit, VisitStatus } from '../../../types/booking.types';

interface VisitRow extends BookingVisit {
  booking?: { bookingNumber: string };
}

const STATUS_OPTIONS: { id: VisitStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'SCHEDULED', label: 'Scheduled' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'EN_ROUTE', label: 'En Route' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'MISSED', label: 'Missed' },
];

export function Visits(): JSX.Element {
  const v = useVisits();

  const columns: ColumnDef<VisitRow>[] = [
    {
      key: 'sequence',
      header: 'Visit',
      render: (row) => (
        <div>
          <p className="font-mono text-2xs text-ink-500">{row.booking?.bookingNumber ?? '—'}</p>
          <p className="font-semibold text-ink-900 mt-0.5">Visit #{row.sequenceNo}</p>
        </div>
      ),
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (row) => formatDateTime(row.scheduledStartAt),
    },
    {
      key: 'checkin',
      header: 'Check-in / out',
      render: (row) => (
        <div className="text-sm">
          {row.checkInAt ? (
            <p className="text-ink-700">{formatTime(row.checkInAt)} → {row.checkOutAt ? formatTime(row.checkOutAt) : '—'}</p>
          ) : (
            <p className="text-ink-400">—</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} kind="visit" />,
    },
  ];

  return (
    <SidebarLayout title="Visits" description="Track check-ins and visit progress in real time">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            <Calendar className="h-3 w-3 inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={v.dateFilter}
            onChange={(e) => v.setDateFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
          />
        </div>
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            Status
          </label>
          <div className="bg-white rounded-xl ring-1 ring-ink-200 p-1 inline-flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => v.setStatusFilter(o.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  v.statusFilter === o.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {v.error ? (
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {v.error}
        </div>
      ) : null}

      <Card padding="none" className="mt-6 overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={v.visits}
          rowKey={(row) => row.id}
          isLoading={v.isLoading}
          emptyState={
            <EmptyState
              title="No visits for this filter"
              description="Try a different date or status."
            />
          }
        />
        {v.meta ? <Pagination meta={v.meta} onPageChange={v.setPage} /> : null}
      </Card>
    </SidebarLayout>
  );
}
