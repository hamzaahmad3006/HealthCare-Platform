import { CalendarClock, Users, Activity, Star, ArrowUpRight, TrendingUp, PieChart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from 'recharts';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { KpiCard } from '../../../component/admin/KpiCard';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { Card } from '../../../constant/Card';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { KpiCardSkeleton, Skeleton } from '../../../component/common/Skeleton';
import { EmptyState } from '../../../component/common/EmptyState';
import { formatDateTime, formatCurrency } from '../../../helper/format';
import { useAdminDashboard } from './useAdminDashboard';
import type { Booking, BookingStatus } from '../../../types/booking.types';

interface RecentBookingRow extends Booking {
  patient?: { fullName: string };
  serviceType?: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     '#f59e0b',
  CONFIRMED:   '#3b82f6',
  ASSIGNED:    '#8b5cf6',
  IN_PROGRESS: '#06b6d4',
  COMPLETED:   '#10b981',
  CANCELLED:   '#ef4444',
  RESCHEDULED: '#f97316',
};

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-2xl bg-ink-100 animate-pulse" />
            <div className="h-64 rounded-2xl bg-ink-100 animate-pulse" />
          </div>
          <div className="mt-6 bg-white rounded-2xl ring-1 ring-ink-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
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

          {/* Charts row */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Bookings trend — bar chart */}
            <Card padding="lg" className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                <h2 className="font-semibold text-ink-900">Bookings — last 7 days</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.summary.bookingsTrend} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 13 }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Status breakdown — pie chart */}
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="h-4 w-4 text-brand-600" />
                <h2 className="font-semibold text-ink-900">Status breakdown</h2>
              </div>
              {d.summary.statusBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-ink-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPie>
                    <Pie
                      data={d.summary.statusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="45%"
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {d.summary.statusBreakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }}
                      formatter={(val, name) => [val, String(name).replace(/_/g, ' ')]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(val) => <span style={{ fontSize: 11, color: '#64748b' }}>{String(val).replace(/_/g, ' ')}</span>}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

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
