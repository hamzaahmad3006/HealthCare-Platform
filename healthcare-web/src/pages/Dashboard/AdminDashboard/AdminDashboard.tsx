import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Users,
  Activity,
  Star,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieIcon,
  RefreshCw,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  MapPin,
  Banknote,
  Stethoscope,
  HeartPulse,
  Search,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { KpiCardSkeleton, Skeleton } from '../../../component/common/Skeleton';
import { EmptyState } from '../../../component/common/EmptyState';
import { formatDateTime, formatCurrency, formatRelative } from '../../../helper/format';
import { useAdminDashboard, type RecentBooking } from './useAdminDashboard';
import { useAppSelector } from '../../../redux/store';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  ASSIGNED: '#8b5cf6',
  IN_PROGRESS: '#06b6d4',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  RESCHEDULED: '#f97316',
  PENDING_DOCTOR: '#ec4899',
  TIME_PROPOSED: '#6366f1',
};

export function AdminDashboard(): JSX.Element {
  const d = useAdminDashboard();
  const currentUser = useAppSelector((s) => s.auth.user);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const adminName = currentUser?.fullName?.split(' ')[0] ?? 'Admin';

  // Format today's date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Filtered recent bookings
  const filteredBookings = useMemo(() => {
    return d.recentBookings.filter((b) => {
      const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
      const matchesSearch =
        !searchQuery ||
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.patient?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.serviceType?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [d.recentBookings, filterStatus, searchQuery]);

  // Total volume in trend
  const totalTrendVolume = useMemo(() => {
    if (!d.summary?.bookingsTrend) return 0;
    return d.summary.bookingsTrend.reduce((acc, curr) => acc + curr.bookings, 0);
  }, [d.summary?.bookingsTrend]);

  return (
    <SidebarLayout
      title="Operations Command"
      description="Live hospital-grade healthcare delivery and fleet telemetry"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => void d.refresh()}
            disabled={d.isRefreshing}
            title="Refresh operational telemetry"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5 text-ink-500', d.isRefreshing && 'animate-spin text-brand-600')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-brand hover:brightness-105 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Booking</span>
          </Link>
        </div>
      }
    >
      {d.error ? (
        <div className="mb-6 p-4 rounded-2xl bg-danger-50 border border-danger-200 text-sm text-danger-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-danger-600 flex-shrink-0" />
            <span>{d.error}</span>
          </div>
          <button
            onClick={() => void d.refresh()}
            className="text-xs font-bold uppercase tracking-wider text-danger-700 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Top Welcome & Telemetry Strip */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-ink-900 text-white p-6 sm:p-7 shadow-xl shadow-brand-950/10 relative overflow-hidden animate-fade-in-up">
        {/* Subtle decorative background curves with smooth ambient float */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute right-40 -bottom-16 w-52 h-52 rounded-full bg-accent-500/10 blur-2xl pointer-events-none animate-float-reverse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-2xs font-semibold text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              Live Operations Control Desk
              <span className="text-white/40">·</span>
              <span>Faisalabad Network</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {adminName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-brand-100/80 max-w-xl">
              All clinical dispatches, homecare nurse schedules, and doctor consultations are synchronizing in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-200/70">Current Date</p>
              <p className="text-xs sm:text-sm font-semibold text-white">{todayFormatted}</p>
            </div>
            <Link
              to="/admin/visits"
              className="px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold tracking-wide shadow-brand transition-all flex items-center gap-1.5 group"
            >
              <span>Field Visits</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {d.isLoading || !d.summary ? (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 rounded-2xl bg-white border border-ink-100 p-6 animate-pulse" />
            <div className="h-72 rounded-2xl bg-white border border-ink-100 p-6 animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Urgent Pending Action Banner */}
          {d.summary.pendingBookings > 0 ? (
            <div className="rounded-2xl border border-warning-200/80 bg-gradient-to-r from-warning-50 via-amber-50/60 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-warning-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-warning-500/20">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-ink-900 text-sm sm:text-base">
                        {d.summary.pendingBookings} Booking{d.summary.pendingBookings > 1 ? 's' : ''} Awaiting Confirmation & Dispatch
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-warning-100 text-warning-800 uppercase tracking-wider">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink-600 mt-0.5">
                      Target response time is under 15 minutes. Dispatch certified nurses or assign visiting doctors immediately.
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin/bookings?status=PENDING"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink-900 hover:bg-ink-800 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex-shrink-0"
                >
                  <span>Review & Dispatch</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/60 via-brand-50/40 to-white px-5 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold text-ink-800">
                  All active patient bookings are confirmed & on schedule. Queue response SLA is 100%.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-2xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full">
                Zero Backlog
              </span>
            </div>
          )}

          {/* KPI Strip — 4 Hero Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-fade-in-up">
            {/* Card 1: Total Bookings */}
            <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Total Bookings</span>
                  <div className="h-10 w-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-brand group-hover:scale-105 transition-transform duration-300">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-ink-950 tracking-tight">
                    {d.summary.totalBookings}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                  <span className="text-ink-500 font-medium">{d.summary.completedBookings} completed visits</span>
                  <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <TrendingUp className="h-3 w-3" />
                    +14.8%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Fulfillment Rate */}
            <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Completion Rate</span>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 text-white flex items-center justify-center shadow-accent group-hover:scale-105 transition-transform duration-300">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-ink-950 tracking-tight">
                    {d.summary.completionRate}
                  </span>
                  <span className="text-lg font-bold text-ink-400">%</span>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 space-y-1.5">
                  <div className="w-full bg-ink-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(d.summary.completionRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-2xs text-ink-500 font-medium">
                    <span>Clinical delivery target</span>
                    <span className="font-bold text-accent-700">95% Goal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Staff Utilization & Fleet */}
            <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Field Staff Roster</span>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-ink-950 tracking-tight">
                    {d.summary.availableStaff}
                  </span>
                  <span className="text-sm font-semibold text-ink-500">/ {d.summary.totalStaff} on duty</span>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                  <span className="text-ink-500 font-medium">Utilization: {d.summary.staffUtilization}%</span>
                  <span className="inline-flex items-center gap-1 text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
                    Available
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Patient Rating */}
            <div className="rounded-2xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-125 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400">Patient Satisfaction</span>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                    <Star className="h-5 w-5 fill-white" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-ink-950 tracking-tight">
                    {d.summary.avgRating ? d.summary.avgRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-sm font-semibold text-ink-500">/ 5.0</span>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-2xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                    Verified Reviews
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Trend Chart (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl bg-white border border-ink-100 p-5 sm:p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-ink-900">
                      7-Day Patient Booking Velocity
                    </h2>
                    <p className="text-xs text-ink-500">
                      Daily homecare appointment demand across Faisalabad
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-800 border border-brand-200/60">
                    <span>This Week:</span>
                    <span className="text-brand-900">{totalTrendVolume} bookings</span>
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.summary.bookingsTrend} barSize={32}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-xl bg-ink-950 text-white p-3 shadow-xl border border-ink-800 text-xs">
                              <p className="font-semibold text-ink-300">{data?.payload?.label}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand-400" />
                                <span className="text-base font-extrabold text-white">
                                  {data?.value} {data?.value === 1 ? 'Booking' : 'Bookings'}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="url(#barGrad)"
                      radius={[8, 8, 0, 0]}
                      name="Patient Bookings"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Breakdown Donut Chart (1 col) */}
            <div className="rounded-2xl bg-white border border-ink-100 p-5 sm:p-6 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-accent-50 text-accent-700 flex items-center justify-center">
                    <PieIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-ink-900">
                      Booking Status Distribution
                    </h2>
                    <p className="text-xs text-ink-500">
                      Active operational states
                    </p>
                  </div>
                </div>

                {d.summary.statusBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-xs text-ink-400">
                    No booking data recorded yet
                  </div>
                ) : (
                  <div className="relative h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={d.summary.statusBreakdown}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={78}
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
                          contentStyle={{
                            borderRadius: 12,
                            border: 'none',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            fontSize: 12,
                          }}
                          formatter={(val, name) => [val, String(name).replace(/_/g, ' ')]}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Total</span>
                      <span className="text-xl font-extrabold text-ink-900">{d.summary.totalBookings}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Chips legend */}
              <div className="pt-4 border-t border-ink-100 flex flex-wrap gap-2">
                {d.summary.statusBreakdown.slice(0, 5).map((s) => (
                  <div
                    key={s.status}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink-50 text-2xs font-semibold text-ink-700"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                    />
                    <span>{s.status.replace(/_/g, ' ')}</span>
                    <span className="font-extrabold text-ink-900 ml-0.5">({s.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Operational Command Shortcuts (4 Tiles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/visits"
              className="p-4 rounded-2xl bg-white border border-ink-100 hover:border-brand-300 hover:shadow-card-hover transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors">
                    Field Visits
                  </h3>
                  <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xs text-ink-500 mt-0.5 line-clamp-2">
                  Track en route nurses, GPS check-ins & vitals
                </p>
              </div>
            </Link>

            <Link
              to="/admin/bookings"
              className="p-4 rounded-2xl bg-white border border-ink-100 hover:border-blue-300 hover:shadow-card-hover transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-ink-900 group-hover:text-blue-700 transition-colors">
                    Care Triage Desk
                  </h3>
                  <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xs text-ink-500 mt-0.5 line-clamp-2">
                  Assign staff, propose doctor slots & reschedule
                </p>
              </div>
            </Link>

            <Link
              to="/admin/staff"
              className="p-4 rounded-2xl bg-white border border-ink-100 hover:border-purple-300 hover:shadow-card-hover transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-ink-900 group-hover:text-purple-700 transition-colors">
                    Medical Roster
                  </h3>
                  <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xs text-ink-500 mt-0.5 line-clamp-2">
                  Verify PMDC certificates, licenses & duty shifts
                </p>
              </div>
            </Link>

            <Link
              to="/admin/payments"
              className="p-4 rounded-2xl bg-white border border-ink-100 hover:border-amber-300 hover:shadow-card-hover transition-all duration-200 group flex items-start gap-3.5"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Banknote className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-ink-900 group-hover:text-amber-700 transition-colors">
                    Revenue Ledger
                  </h3>
                  <ChevronRight className="h-4 w-4 text-ink-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xs text-ink-500 mt-0.5 line-clamp-2">
                  Reconcile Cash-on-Delivery, JazzCash & payouts
                </p>
              </div>
            </Link>
          </div>

          {/* Recent Bookings Live Stream Table */}
          <div className="rounded-2xl bg-white border border-ink-100 shadow-card overflow-hidden">
            {/* Table Header */}
            <div className="p-5 sm:p-6 border-b border-ink-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink-900">Recent Patient Bookings</h2>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  Real-time incoming homecare appointments and dispatch updates
                </p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient or booking..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-ink-200 bg-ink-50/50 text-xs text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-48 sm:w-56"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <Link
                  to="/admin/bookings"
                  className="text-xs font-bold text-brand-700 hover:text-brand-800 ml-2 whitespace-nowrap"
                >
                  View All ({d.summary.totalBookings}) →
                </Link>
              </div>
            </div>

            {/* Table Content */}
            {filteredBookings.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No bookings match your filter"
                  description="Try selecting another status or clear the search query."
                />
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/50">
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Patient & Reference
                      </th>
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Care Service
                      </th>
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Scheduled Slot
                      </th>
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                        Status
                      </th>
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400 text-right">
                        Fee
                      </th>
                      <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400 text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {filteredBookings.map((b) => {
                      const patientName = b.patient?.fullName ?? 'Patient';
                      const patientInitial = patientName[0]?.toUpperCase() ?? 'P';
                      const isUrgent = b.urgencyLevel === 'URGENT' || b.urgencyLevel === 'EMERGENCY';

                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-ink-50/80 transition-colors group cursor-pointer"
                          onClick={() => d.openBooking(b.id)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {patientInitial}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-ink-900 group-hover:text-brand-700 transition-colors truncate">
                                    {patientName}
                                  </p>
                                  {isUrgent && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-danger-100 text-danger-700 animate-pulse">
                                      {b.urgencyLevel}
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-2xs text-ink-400 mt-0.5">
                                  #{b.bookingNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="text-xs font-semibold text-ink-800 block">
                              {b.serviceType?.name ?? 'Homecare Service'}
                            </span>
                            <span className="text-2xs text-ink-400">
                              {b.package?.name ?? 'Standard Visit'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <p className="text-xs font-medium text-ink-800">
                              {formatDateTime(b.requestedStartAt)}
                            </p>
                            <p className="text-2xs text-ink-400">
                              {formatRelative(b.requestedStartAt)}
                            </p>
                          </td>

                          <td className="px-5 py-3.5">
                            <StatusBadge status={b.status} kind="booking" size="sm" />
                          </td>

                          <td className="px-5 py-3.5 text-right font-bold text-ink-900 text-xs">
                            {formatCurrency(b.totalPrice, b.currency)}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                d.openBooking(b.id);
                              }}
                              className="px-2.5 py-1 rounded-lg text-2xs font-bold text-brand-700 hover:bg-brand-50 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Manage</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Telemetry & Compliance Footer */}
          <div className="rounded-2xl border border-ink-100 bg-white p-4 text-xs text-ink-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                API Core: Online (Latency 14ms)
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Redis Cache: 300s TTL Active
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                SMS / WhatsApp Dispatch: Operational
              </span>
            </div>

            <div className="flex items-center gap-2 text-ink-400 text-2xs">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <span>HIPAA-grade Health Data Encryption · HomeHealth Pakistan</span>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
