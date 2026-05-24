import { useEffect, useState, useCallback } from 'react';
import { Banknote, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  bookingId: string;
  paymentMethod: 'CASH' | 'JAZZCASH' | 'STRIPE';
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paidAt: string | null;
  createdAt: string;
  booking: {
    bookingNumber: string;
    customer: { fullName: string; phone: string };
    serviceType: { name: string };
  };
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  cls: 'bg-warning-50 text-warning-700',  icon: Clock },
  PAID:     { label: 'Paid',     cls: 'bg-success-50 text-success-700',  icon: CheckCircle2 },
  FAILED:   { label: 'Failed',   cls: 'bg-danger-50 text-danger-700',    icon: XCircle },
  REFUNDED: { label: 'Refunded', cls: 'bg-ink-100 text-ink-500',         icon: XCircle },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash on Visit',
  JAZZCASH: 'JazzCash',
  STRIPE: 'Stripe',
};

export function PaymentHistory(): JSX.Element {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    api
      .get<{ success: true; data: Payment[]; meta: PaginationMeta }>(`${API.ADMIN.PAYMENTS}?${params}`)
      .then(({ data }) => {
        if (cancelled) return;
        setPayments(data.data);
        setMeta(data.meta);
      })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, statusFilter]);

  useEffect(() => { return load(); }, [load]);

  const handleMarkPaid = async (payment: Payment): Promise<void> => {
    setMarkingId(payment.id);
    try {
      await api.patch(API.PAYMENTS.MARK_PAID(payment.bookingId));
      toast.success('Marked as collected');
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    } finally {
      setMarkingId(null);
    }
  };

  const columns: ColumnDef<Payment>[] = [
    {
      key: 'booking',
      header: 'Booking',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-ink-900 font-mono">{row.booking.bookingNumber}</p>
          <p className="text-xs text-ink-500">{row.booking.serviceType.name}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-ink-900">{row.booking.customer.fullName}</p>
          <p className="text-xs text-ink-400">{row.booking.customer.phone}</p>
        </div>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => (
        <span className="text-sm text-ink-700 font-medium">{METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="text-sm font-bold text-ink-900">{row.currency} {Number(row.amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.PENDING;
        const Icon = cfg.icon;
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
            <Icon className="h-3 w-3" /> {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <div>
          <p className="text-xs text-ink-500">{formatDateTime(row.createdAt)}</p>
          {row.paidAt ? <p className="text-2xs text-success-600">Paid {formatDateTime(row.paidAt)}</p> : null}
        </div>
      ),
    },
    {
      key: 'action',
      header: '',
      render: (row) => row.status === 'PENDING' && row.paymentMethod === 'CASH' ? (
        <button
          onClick={() => handleMarkPaid(row)}
          disabled={markingId === row.id}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-success-600 rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {markingId === row.id ? 'Saving…' : 'Mark Collected'}
        </button>
      ) : null,
    },
  ];

  // Summary stats from current filtered data
  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  return (
    <SidebarLayout title="Payment History" description={meta ? `${meta.total} payments` : 'All payments'}>
      {/* Filters + quick stats */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          className="text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        {statusFilter ? (
          <button
            className="text-sm text-ink-500 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-ink-100 transition-colors"
            onClick={() => { setStatusFilter(''); setPage(1); }}
          >
            Clear
          </button>
        ) : null}
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-500">This page: <span className="font-bold text-success-700">PKR {totalPaid.toLocaleString()} collected</span></span>
          {pendingCount > 0 ? <span className="text-warning-600 font-semibold">{pendingCount} pending</span> : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">{error}</div>
      ) : null}

      <Card padding="none" className="overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={payments}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<Banknote className="h-7 w-7" />}
              title="No payments found"
              description={statusFilter ? 'No payments with this status.' : 'Payments will appear here once bookings are confirmed.'}
            />
          }
        />
        {meta ? <Pagination meta={meta} onPageChange={(p) => setPage(p)} /> : null}
      </Card>
    </SidebarLayout>
  );
}
