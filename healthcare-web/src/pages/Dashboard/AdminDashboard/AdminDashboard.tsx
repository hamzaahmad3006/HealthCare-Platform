import { CalendarClock, Users, Activity, Star, ArrowUpRight } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { KpiCard } from '../../../component/admin/KpiCard';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { Card } from '../../../constant/Card';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { KpiCardSkeleton, Skeleton } from '../../../component/common/Skeleton';
import { EmptyState } from '../../../component/common/EmptyState';
import { formatDateTime, formatCurrency } from '../../../helper/format';
import { useAdminDashboard } from './useAdminDashboard';
import type { Booking } from '../../../types/booking.types';

interface RecentBookingRow extends Booking {
  patient?: { fullName: string };
  serviceType?: { name: string };
}

export function AdminDashboard(): JSX.Element {
  const d = useAdminDashboard();

  const columns: ColumnDef<RecentBookingRow>[] = [
    {
      key: 'bookingNumber',
      header: 'Booking',
      render: (row) => (
        <div>
          <p className="font-mono text-2xs text-ink-500">{row.bookingNumber}</p>
          <p className="font-semibold text-ink-900 mt-0.5">{row.serviceType?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (row) => row.patient?.fullName ?? '—',
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (row) => formatDateTime(row.requestedStartAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} kind="booking" />,
    },
    {
      key: 'price',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-ink-900">
          {formatCurrency(row.totalPrice, row.currency)}
        </span>
      ),
    },
  ];

  return (
    <SidebarLayout title="Dashboard" description="Operational health at a glance">
      {d.error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {d.error}
        </div>
      ) : null}

      {d.isLoading || !d.summary ? (
        <div className="animate-fade-in">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          <div className="mt-6 bg-white rounded-2xl ring-1 ring-ink-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            <KpiCard
              label="Total bookings"
              value={d.summary.totalBookings}
              icon={<CalendarClock className="h-5 w-5" />}
              tone="brand"
            />
            <KpiCard
              label="Completion rate"
              value={d.summary.completionRate}
              unit="%"
              icon={<Activity className="h-5 w-5" />}
              tone="success"
            />
            <KpiCard
              label="Staff utilization"
              value={d.summary.staffUtilization}
              unit="%"
              icon={<Users className="h-5 w-5" />}
              tone="accent"
            />
            <KpiCard
              label="Average rating"
              value={d.summary.avgRating ?? '—'}
              unit={d.summary.avgRating ? '/ 5.0' : ''}
              icon={<Star className="h-5 w-5" />}
              tone="warning"
            />
          </div>

          {/* Pending callout */}
          {d.summary.pendingBookings > 0 ? (
            <Card padding="md" variant="gradient" className="mt-6 animate-slide-up">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-warning-100 text-warning-700 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">
                      {d.summary.pendingBookings} booking{d.summary.pendingBookings > 1 ? 's' : ''} awaiting confirmation
                    </p>
                    <p className="text-sm text-ink-600">Review and confirm to reduce wait times.</p>
                  </div>
                </div>
                <a
                  href="/admin/bookings"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  Go to bookings
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ) : null}

          {/* Recent bookings */}
          <Card padding="none" className="mt-6 animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
              <h2 className="font-semibold text-ink-900">Recent bookings</h2>
              <a
                href="/admin/bookings"
                className="text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View all →
              </a>
            </div>
            <DataTable
              columns={columns}
              data={d.recentBookings}
              rowKey={(b) => b.id}
              onRowClick={(b) => d.openBooking(b.id)}
              emptyState={<EmptyState title="No bookings yet" description="New bookings will appear here." />}
            />
          </Card>
        </>
      )}
    </SidebarLayout>
  );
}
