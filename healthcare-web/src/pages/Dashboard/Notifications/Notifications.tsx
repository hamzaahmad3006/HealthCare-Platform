import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';

interface NotifLog {
  id: string;
  templateCode: string;
  recipient: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  retryCount: number;
  sentAt: string | null;
  createdAt: string;
  providerError: string | null;
  booking: { bookingNumber: string } | null;
}

const STATUS_CONFIG = {
  SENT:    { cls: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  FAILED:  { cls: 'bg-danger-50 text-danger-700',  icon: XCircle },
  PENDING: { cls: 'bg-warning-50 text-warning-700', icon: Clock },
};

const TEMPLATE_LABELS: Record<string, string> = {
  BOOKING_RECEIVED: 'Booking Received',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  BOOKING_CANCELLED: 'Booking Cancelled',
  BOOKING_RESCHEDULED: 'Booking Rescheduled',
  STAFF_ASSIGNED: 'Staff Assigned',
  STAFF_EN_ROUTE: 'Staff En Route',
  VISIT_REMINDER: 'Visit Reminder',
  REPORT_AVAILABLE: 'Report Available',
  PACKAGE_RENEWAL: 'Package Renewal',
};

export function Notifications(): JSX.Element {
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (statusFilter) params.set('status', statusFilter);
    api
      .get<{ success: true; data: NotifLog[]; meta: PaginationMeta }>(`${API.ADMIN.NOTIFICATIONS}?${params}`)
      .then(({ data }) => { if (!cancelled) { setLogs(data.data); setMeta(data.meta); } })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, statusFilter]);

  useEffect(() => { return load(); }, [load]);

  const handleRetry = async (id: string): Promise<void> => {
    setRetryingId(id);
    try {
      await api.post(API.ADMIN.NOTIFICATION_RETRY(id));
      toast.success('Notification queued for retry');
      load();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setRetryingId(null);
    }
  };

  const columns: ColumnDef<NotifLog>[] = [
    {
      key: 'time',
      header: 'Time',
      render: (row) => <span className="text-xs text-ink-500 whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'template',
      header: 'Template',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-ink-900">{TEMPLATE_LABELS[row.templateCode] ?? row.templateCode}</p>
          {row.booking ? <p className="text-2xs text-ink-400 font-mono">{row.booking.bookingNumber}</p> : null}
        </div>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      render: (row) => <span className="text-sm font-mono text-ink-700">{row.recipient}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.PENDING;
        const Icon = cfg.icon;
        return (
          <div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
              <Icon className="h-3 w-3" /> {row.status}
            </span>
            {row.retryCount > 0 ? (
              <p className="text-2xs text-ink-400 mt-0.5">{row.retryCount} retries</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'sent',
      header: 'Sent at',
      render: (row) => row.sentAt
        ? <span className="text-xs text-ink-500">{formatDateTime(row.sentAt)}</span>
        : <span className="text-xs text-ink-300">—</span>,
    },
    {
      key: 'action',
      header: '',
      render: (row) => row.status === 'FAILED' ? (
        <button
          onClick={() => void handleRetry(row.id)}
          disabled={retryingId === row.id}
          title="Retry sending"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${retryingId === row.id ? 'animate-spin' : ''}`} />
          {retryingId === row.id ? '…' : 'Retry'}
        </button>
      ) : null,
    },
  ];

  const failedCount = logs.filter((l) => l.status === 'FAILED').length;

  return (
    <SidebarLayout title="Notifications" description={meta ? `${meta.total} notification logs` : 'WhatsApp notification log'}>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
        {statusFilter ? (
          <button
            className="text-sm text-ink-500 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-ink-100 transition-colors"
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Clear
          </button>
        ) : null}
        {failedCount > 0 ? (
          <span className="ml-auto text-sm font-semibold text-danger-700">
            {failedCount} failed on this page
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">{error}</div>
      ) : null}

      <Card padding="none" className="overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={logs}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<Bell className="h-7 w-7" />}
              title="No notifications found"
              description={statusFilter ? 'No notifications with this status.' : 'Notification logs will appear here once bookings are created.'}
            />
          }
        />
        {meta ? <Pagination meta={meta} onPageChange={(p) => setPage(p)} /> : null}
      </Card>
    </SidebarLayout>
  );
}
