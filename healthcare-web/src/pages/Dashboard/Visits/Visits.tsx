import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Navigation,
  LogIn,
  LogOut,
  CheckCircle2,
  Loader2,
  X,
  CalendarX,
  FileText,
  ClipboardList,
  Upload,
  Star,
  Search,
  RefreshCw,
  Clock,
  MapPin,
  User,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Sparkles,
  Compass,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime, formatTime } from '../../../helper/format';
import { useVisits, type VisitRow } from './useVisits';
import type { VisitStatus } from '../../../types/booking.types';
import type { ReportType } from '../../../types/report.types';

const STATUS_OPTIONS: { id: VisitStatus | 'ALL'; label: string; dotColor: string }[] = [
  { id: 'ALL', label: 'All Visits', dotColor: 'bg-ink-400' },
  { id: 'SCHEDULED', label: 'Scheduled', dotColor: 'bg-brand-500' },
  { id: 'ASSIGNED', label: 'Assigned', dotColor: 'bg-purple-500' },
  { id: 'EN_ROUTE', label: 'En Route', dotColor: 'bg-amber-500' },
  { id: 'CHECKED_IN', label: 'Checked In', dotColor: 'bg-cyan-500' },
  { id: 'COMPLETED', label: 'Completed', dotColor: 'bg-emerald-500' },
  { id: 'MISSED', label: 'Missed', dotColor: 'bg-rose-500' },
];

type ModalMode = 'check-in' | 'check-out';

interface ActionModalState {
  mode: ModalMode;
  visitId: string;
}

interface UploadModalState {
  visitId: string;
  bookingId: string;
  patientId: string;
  serviceTypeCode: string;
}

function hasAnyNotes(row: VisitRow): boolean {
  return Boolean(
    row.beforeConditionText || row.afterConditionText || row.visitNotes || row.checkInAt || row.booking?.reviews?.length,
  );
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRelativeDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function Visits(): JSX.Element {
  const v = useVisits();
  const [modal, setModal] = useState<ActionModalState | null>(null);
  const [detailsVisit, setDetailsVisit] = useState<VisitRow | null>(null);
  const [uploadModal, setUploadModal] = useState<UploadModalState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Date shortcut helpers
  const todayStr = useMemo(() => getTodayString(), []);
  const tomorrowStr = useMemo(() => getRelativeDateString(1), []);
  const yesterdayStr = useMemo(() => getRelativeDateString(-1), []);

  // Compute live operational KPIs from currently loaded visits
  const metrics = useMemo(() => {
    const list = v.visits;
    const total = v.meta?.total ?? list.length;
    const enRoute = list.filter((item) => item.status === 'EN_ROUTE').length;
    const checkedIn = list.filter((item) => item.status === 'CHECKED_IN').length;
    const completed = list.filter((item) => item.status === 'COMPLETED').length;
    const scheduled = list.filter((item) => item.status === 'SCHEDULED' || item.status === 'ASSIGNED').length;
    return { total, enRoute, checkedIn, completed, scheduled };
  }, [v.visits, v.meta?.total]);

  // Client-side quick filter over loaded records for seamless instant search
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return v.visits;
    const q = searchQuery.toLowerCase().trim();
    return v.visits.filter((row) => {
      const bNum = row.booking?.bookingNumber?.toLowerCase() ?? '';
      const pName = row.booking?.patient?.fullName?.toLowerCase() ?? '';
      const staffName = row.assignedStaff?.user?.fullName?.toLowerCase() ?? '';
      const area = row.booking?.address?.area?.toLowerCase() ?? '';
      const notes = (row.visitNotes ?? '').toLowerCase();
      const seq = `visit #${row.sequenceNo}`;
      return (
        bNum.includes(q) ||
        pName.includes(q) ||
        staffName.includes(q) ||
        area.includes(q) ||
        notes.includes(q) ||
        seq.includes(q)
      );
    });
  }, [v.visits, searchQuery]);

  const columns: ColumnDef<VisitRow>[] = [
    {
      key: 'sequence',
      header: 'Visit & Booking',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/70 border border-brand-200/60 flex items-center justify-center font-bold text-xs text-brand-700 shadow-sm">
            #{row.sequenceNo}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-semibold text-ink-900">
                {row.booking?.bookingNumber ?? '—'}
              </span>
              {row.booking?.serviceType?.code ? (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700 border border-ink-200">
                  {row.booking.serviceType.name ?? row.booking.serviceType.code}
                </span>
              ) : null}
            </div>
            {row.booking?.patient?.fullName ? (
              <p className="text-xs text-ink-600 font-medium flex items-center gap-1 mt-0.5 truncate">
                <User className="h-3 w-3 text-ink-400 flex-shrink-0" />
                {row.booking.patient.fullName}
              </p>
            ) : (
              <p className="text-2xs text-ink-400 mt-0.5">Visit #{row.sequenceNo}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'scheduled',
      header: 'Scheduled Window',
      render: (row) => {
        const isToday = row.scheduledStartAt.slice(0, 10) === todayStr;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-800">
              <Calendar className="h-3.5 w-3.5 text-brand-500" />
              <span>{formatDateTime(row.scheduledStartAt)}</span>
            </div>
            {isToday ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Today's Slot
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'careTelemetry',
      header: 'Care Telemetry',
      render: (row) => (
        <div className="text-xs">
          {row.checkInAt ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-ink-800 font-mono font-medium">
                <span className="text-emerald-600 font-semibold">{formatTime(row.checkInAt)}</span>
                <span className="text-ink-400">→</span>
                {row.checkOutAt ? (
                  <span className="text-brand-700 font-semibold">{formatTime(row.checkOutAt)}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 font-sans">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    In Session
                  </span>
                )}
              </div>
              {row.assignedStaff?.user?.fullName ? (
                <p className="text-2xs text-ink-500 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-brand-600" />
                  Staff: <span className="font-medium text-ink-700">{row.assignedStaff.user.fullName}</span>
                </p>
              ) : null}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-ink-400 text-xs italic">
              <Clock className="h-3 w-3" />
              Awaiting check-in
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} kind="visit" />,
    },
    {
      key: 'actions',
      header: 'Action Suite',
      align: 'right',
      render: (row) => {
        const busy = v.actionLoadingId === row.id;
        const buttons: JSX.Element[] = [];

        if (row.status === 'ASSIGNED' || row.status === 'SCHEDULED') {
          buttons.push(
            <ActionButton
              key="en-route"
              icon={<Compass className="h-3.5 w-3.5 text-amber-600" />}
              label="Start En-Route"
              busy={busy}
              variant="outline"
              onClick={() => void v.handleEnRoute(row.id)}
            />,
          );
        }

        if (row.status === 'ASSIGNED' || row.status === 'EN_ROUTE') {
          buttons.push(
            <ActionButton
              key="check-in"
              icon={<LogIn className="h-3.5 w-3.5" />}
              label="Check In"
              variant="primary"
              busy={busy}
              onClick={() => setModal({ mode: 'check-in', visitId: row.id })}
            />,
          );
        }

        if (row.status === 'CHECKED_IN' && !row.checkOutAt) {
          buttons.push(
            <ActionButton
              key="check-out"
              icon={<LogOut className="h-3.5 w-3.5" />}
              label="Check Out"
              variant="secondary"
              busy={busy}
              onClick={() => setModal({ mode: 'check-out', visitId: row.id })}
            />,
          );
        }

        if (row.status === 'CHECKED_IN' && row.checkOutAt) {
          buttons.push(
            <ActionButton
              key="complete"
              icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              label="Complete Visit"
              variant="success"
              busy={busy}
              onClick={() => void v.handleComplete(row.id)}
            />,
          );
        }

        if (hasAnyNotes(row)) {
          buttons.push(
            <ActionButton
              key="details"
              icon={<FileText className="h-3.5 w-3.5" />}
              label="View Details"
              busy={false}
              variant="ghost"
              onClick={() => setDetailsVisit(row)}
            />,
          );
        }

        if (row.status === 'COMPLETED' && row.booking?.patientId && row.booking?.serviceType?.code === 'LAB_SAMPLING') {
          buttons.push(
            <ActionButton
              key="upload"
              icon={<Upload className="h-3.5 w-3.5" />}
              label="Upload Report"
              variant="brand"
              busy={false}
              onClick={() =>
                setUploadModal({
                  visitId: row.id,
                  bookingId: row.bookingId,
                  patientId: row.booking!.patientId,
                  serviceTypeCode: row.booking?.serviceType?.code ?? 'OTHER',
                })
              }
            />,
          );
        }

        if (buttons.length === 0) {
          return <span className="text-2xs text-ink-400 font-mono">—</span>;
        }

        return <div className="inline-flex gap-1.5 justify-end flex-wrap">{buttons}</div>;
      },
    },
  ];

  return (
    <SidebarLayout
      title="Field Visits Desk"
      description="Real-time staff dispatch telemetry, arrival/departure timestamps, and clinical care milestones"
    >
      {/* ── Top Command Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 ring-4 ring-brand-50">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900 tracking-tight">Field Visits Command</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Monitoring clinical personnel dispatch, geo check-in verifications & patient notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-all shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
            Bookings Desk
          </Link>
          <button
            type="button"
            onClick={v.reload}
            disabled={v.isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${v.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Operational Metrics Strip ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        <MetricCard
          label="Total Visits"
          value={metrics.total}
          subtext={v.dateFilter ? `Date: ${v.dateFilter}` : 'All Scheduled'}
          icon={<Calendar className="h-5 w-5 text-brand-600" />}
          gradient="from-brand-50 to-indigo-50/50"
          borderColor="border-brand-100"
        />
        <MetricCard
          label="In Care Now"
          value={metrics.checkedIn}
          subtext="Checked in with patient"
          icon={<Activity className="h-5 w-5 text-cyan-600" />}
          gradient="from-cyan-50 to-teal-50/50"
          borderColor="border-cyan-100"
          pulse
        />
        <MetricCard
          label="En Route"
          value={metrics.enRoute}
          subtext="Staff traveling to location"
          icon={<Compass className="h-5 w-5 text-amber-600" />}
          gradient="from-amber-50 to-orange-50/50"
          borderColor="border-amber-100"
        />
        <MetricCard
          label="Completed"
          value={metrics.completed}
          subtext="Care session finished"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          gradient="from-emerald-50 to-teal-50/50"
          borderColor="border-emerald-100"
        />
        <MetricCard
          label="Awaiting Care"
          value={metrics.scheduled}
          subtext="Scheduled or assigned"
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          gradient="from-purple-50 to-pink-50/50"
          borderColor="border-purple-100"
        />
      </div>

      {/* ── Date Picker, Quick Presets & Search Bar ─────────────────── */}
      <div className="bg-white rounded-2xl p-4 ring-1 ring-ink-200/80 shadow-sm mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Date Selector & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative inline-flex items-center">
              <Calendar className="h-4 w-4 absolute left-3 text-ink-400 pointer-events-none" />
              <input
                type="date"
                value={v.dateFilter}
                onChange={(e) => v.setDateFilter(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-ink-50/50 text-ink-900 transition-all cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => v.setDateFilter(todayStr)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  v.dateFilter === todayStr
                    ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700'
                    : 'bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => v.setDateFilter(tomorrowStr)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  v.dateFilter === tomorrowStr
                    ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700'
                    : 'bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => v.setDateFilter(yesterdayStr)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  v.dateFilter === yesterdayStr
                    ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700'
                    : 'bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  v.setDateFilter('');
                  v.setStatusFilter('ALL');
                }}
                disabled={!v.dateFilter && v.statusFilter === 'ALL'}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-ink-100 text-ink-700 hover:bg-ink-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Clear date and view all visits"
              >
                <CalendarX className="h-3.5 w-3.5" />
                All Dates
              </button>
            </div>
          </div>

          {/* Instant Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search booking #, patient, notes..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-ink-200 bg-white placeholder-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="border-t border-ink-100 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {STATUS_OPTIONS.map((o) => {
              const active = v.statusFilter === o.id;
              const count =
                o.id === 'ALL'
                  ? v.visits.length
                  : v.visits.filter((item) => item.status === o.id).length;
              return (
                <button
                  key={o.id}
                  onClick={() => v.setStatusFilter(o.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-700'
                      : 'bg-ink-50/70 text-ink-600 hover:bg-ink-100/70 hover:text-ink-900 ring-1 ring-transparent'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${o.dotColor} ${active ? 'ring-2 ring-white/50' : ''}`} />
                  <span>{o.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-ink-200/60 text-ink-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {v.error ? (
        <div
          role="alert"
          className="mb-6 px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger-500 flex-shrink-0" />
            <span className="font-medium">{v.error}</span>
          </div>
          <button
            type="button"
            onClick={v.reload}
            className="px-3 py-1.5 rounded-xl bg-white ring-1 ring-danger-200 text-xs font-semibold text-danger-700 hover:bg-danger-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* ── Main Visits Table ──────────────────────────────────────── */}
      <Card padding="none" className="overflow-hidden shadow-sm border border-ink-200/80 rounded-2xl animate-fade-in-up">
        <DataTable
          columns={columns}
          data={filteredVisits}
          rowKey={(row) => row.id}
          isLoading={v.isLoading}
          emptyState={
            <EmptyState
              title={searchQuery ? 'No visits match your search' : 'No visits found'}
              description={
                searchQuery
                  ? `Clear your query "${searchQuery}" or choose another date.`
                  : 'There are no clinical visits recorded for the selected date or status filter.'
              }
            />
          }
        />
        {v.meta && v.meta.total > v.meta.limit ? (
          <div className="p-4 border-t border-ink-100">
            <Pagination meta={v.meta} onPageChange={v.setPage} />
          </div>
        ) : null}
      </Card>

      {/* ── Check-in / Check-out Action Modal ──────────────────────── */}
      {modal ? (
        <ActionModal
          mode={modal.mode}
          busy={v.actionLoadingId === modal.visitId}
          onClose={() => setModal(null)}
          onSubmit={async (form) => {
            const ok =
              modal.mode === 'check-in'
                ? await v.handleCheckIn(modal.visitId, { beforeConditionText: form.condition })
                : await v.handleCheckOut(modal.visitId, {
                    afterConditionText: form.condition,
                    visitNotes: form.notes,
                  });
            if (ok) setModal(null);
          }}
        />
      ) : null}

      {/* ── Visit Clinical Details Modal ───────────────────────────── */}
      {detailsVisit ? (
        <DetailsModal visit={detailsVisit} onClose={() => setDetailsVisit(null)} />
      ) : null}

      {/* ── Upload Lab / Care Report Modal ─────────────────────────── */}
      {uploadModal ? (
        <UploadReportModal
          busy={v.isUploadingReport}
          serviceTypeCode={uploadModal.serviceTypeCode}
          onClose={() => setUploadModal(null)}
          onSubmit={async (form) => {
            const ok = await v.handleUploadReport({
              ...form,
              bookingId: uploadModal.bookingId,
              bookingVisitId: uploadModal.visitId,
              patientId: uploadModal.patientId,
            });
            if (ok) setUploadModal(null);
          }}
        />
      ) : null}
    </SidebarLayout>
  );
}

// ── Metric Card Component ─────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: JSX.Element;
  gradient: string;
  borderColor: string;
  pulse?: boolean;
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  gradient,
  borderColor,
  pulse = false,
}: MetricCardProps): JSX.Element {
  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} p-4 rounded-2xl border ${borderColor} shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <span className="text-2xs font-bold uppercase tracking-wider text-ink-500">{label}</span>
        <div className="p-2 rounded-xl bg-white/80 backdrop-blur-xs shadow-xs ring-1 ring-ink-100">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black text-ink-900 tracking-tight">{value}</span>
        {pulse ? (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
        ) : null}
      </div>
      <p className="text-[11px] font-medium text-ink-500 mt-1 truncate">{subtext}</p>
    </div>
  );
}

// ── Action Button Component ───────────────────────────────────────────
interface ActionButtonProps {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  busy?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'brand' | 'outline' | 'ghost';
}

function ActionButton({
  icon,
  label,
  onClick,
  busy,
  variant = 'ghost',
}: ActionButtonProps): JSX.Element {
  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed';

  let variantCls = 'bg-ink-100 text-ink-700 hover:bg-ink-200';
  if (variant === 'primary') {
    variantCls = 'bg-brand-600 text-white hover:bg-brand-700 ring-1 ring-brand-700 shadow-brand-500/10';
  } else if (variant === 'secondary') {
    variantCls = 'bg-cyan-600 text-white hover:bg-cyan-700 ring-1 ring-cyan-700';
  } else if (variant === 'success') {
    variantCls = 'bg-emerald-600 text-white hover:bg-emerald-700 ring-1 ring-emerald-700';
  } else if (variant === 'brand') {
    variantCls = 'bg-indigo-600 text-white hover:bg-indigo-700 ring-1 ring-indigo-700';
  } else if (variant === 'outline') {
    variantCls = 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50 hover:text-ink-900';
  }

  return (
    <button onClick={onClick} disabled={busy} className={`${base} ${variantCls}`}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

// ── Details Modal ─────────────────────────────────────────────────────
interface DetailsModalProps {
  visit: VisitRow;
  onClose: () => void;
}

function DetailsModal({ visit, onClose }: DetailsModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-ink-200 w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-sm">
              #{visit.sequenceNo}
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900 flex items-center gap-2">
                Visit Clinical Log
                <StatusBadge status={visit.status} kind="visit" />
              </h2>
              <p className="text-xs text-ink-500 font-mono mt-0.5">
                Ref: {visit.booking?.bookingNumber ?? '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Timeline & Schedule Cards */}
        <div className="mt-5 space-y-4">
          <div className="bg-ink-50/70 rounded-2xl p-4 border border-ink-100 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500 font-medium">Scheduled Start:</span>
              <span className="font-semibold text-ink-800">{formatDateTime(visit.scheduledStartAt)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500 font-medium">Actual Check-In:</span>
              <span className="font-semibold text-emerald-700">
                {visit.checkInAt ? formatDateTime(visit.checkInAt) : 'Not recorded'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500 font-medium">Actual Check-Out:</span>
              <span className="font-semibold text-brand-700">
                {visit.checkOutAt ? formatDateTime(visit.checkOutAt) : 'Not recorded'}
              </span>
            </div>
            {visit.assignedStaff?.user?.fullName ? (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-ink-200/60">
                <span className="text-ink-500 font-medium">Assigned Clinician:</span>
                <span className="font-semibold text-ink-900">{visit.assignedStaff.user.fullName}</span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <ClinicalNoteBlock
              title="Arrival Condition Assessment"
              content={visit.beforeConditionText}
              emptyText="No arrival vitals or condition documented."
            />

            <ClinicalNoteBlock
              title="Departure Condition Assessment"
              content={visit.afterConditionText}
              emptyText="No departure vitals or condition documented."
            />

            <ClinicalNoteBlock
              title="Clinician Visit Notes"
              content={visit.visitNotes}
              emptyText="No clinical care notes recorded for this visit."
            />
          </div>

          {/* Customer Feedback Block if available */}
          {visit.status === 'COMPLETED' && visit.booking?.reviews?.length ? (
            <div className="rounded-2xl p-4 bg-amber-50/60 border border-amber-200/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Patient Star Rating
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= (visit.booking!.reviews![0]?.rating ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-amber-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {visit.booking.reviews[0]?.reviewText ? (
                <p className="text-xs text-amber-900/90 italic bg-white/80 p-3 rounded-xl border border-amber-200/50">
                  "{visit.booking.reviews[0].reviewText}"
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-700 bg-ink-100 rounded-xl hover:bg-ink-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function ClinicalNoteBlock({
  title,
  content,
  emptyText,
}: {
  title: string;
  content: string | null | undefined;
  emptyText: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-3.5">
      <p className="text-2xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">{title}</p>
      {content ? (
        <p className="text-xs text-ink-800 whitespace-pre-wrap leading-relaxed bg-ink-50/50 p-2.5 rounded-xl border border-ink-100">
          {content}
        </p>
      ) : (
        <p className="text-xs text-ink-400 italic">{emptyText}</p>
      )}
    </div>
  );
}

// ── Check-in / Check-out Action Modal ─────────────────────────────────
interface ActionModalProps {
  mode: ModalMode;
  busy: boolean;
  onClose: () => void;
  onSubmit: (form: { condition: string; notes: string }) => Promise<void>;
}

function ActionModal({ mode, busy, onClose, onSubmit }: ActionModalProps): JSX.Element {
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const isCheckIn = mode === 'check-in';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-ink-200 w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-start justify-between pb-4 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-2xl flex items-center justify-center text-white ${
                isCheckIn
                  ? 'bg-gradient-to-tr from-brand-600 to-indigo-500'
                  : 'bg-gradient-to-tr from-cyan-600 to-teal-500'
              }`}
            >
              {isCheckIn ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">
                {isCheckIn ? 'Confirm Field Check-In' : 'Confirm Field Check-Out'}
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                {isCheckIn ? 'Mark arrival at patient premises' : 'Complete care session & record notes'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* GPS location telemetry note */}
        <div className="mt-4 p-3 rounded-2xl bg-brand-50/70 border border-brand-200/60 flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-brand-900 leading-relaxed">
            {isCheckIn
              ? "Your current GPS coordinate will be captured to verify arrival timestamp."
              : "Departure coordinates will be recorded alongside clinical observation notes."}
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
              {isCheckIn ? 'Patient condition on arrival' : 'Patient condition on departure'}
              <span className="font-normal lowercase ml-1 text-ink-400">(optional)</span>
            </label>
            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              rows={3}
              placeholder={
                isCheckIn
                  ? 'e.g. Patient conscious, alert, resting comfortably, vitals taken...'
                  : 'e.g. Patient feeling better, post-procedure dressing applied...'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all placeholder-ink-400"
            />
          </div>

          {!isCheckIn ? (
            <div>
              <label className="text-2xs font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
                Care Summary & Notes <span className="font-normal lowercase text-ink-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What clinical treatments or tests were administered?"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all placeholder-ink-400"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-xs font-semibold text-ink-700 bg-ink-100 rounded-xl hover:bg-ink-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onSubmit({ condition: condition.trim(), notes: notes.trim() })}
            disabled={busy}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-50 ${
              isCheckIn
                ? 'bg-brand-600 hover:bg-brand-700 ring-1 ring-brand-700'
                : 'bg-cyan-600 hover:bg-cyan-700 ring-1 ring-cyan-700'
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isCheckIn ? 'Confirm Arrival' : 'Confirm Check Out'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload Report Modal ───────────────────────────────────────────────
const ALL_REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: 'VISIT_NOTE', label: 'Visit Note' },
  { id: 'LAB_RESULT', label: 'Lab Result' },
  { id: 'PRESCRIPTION', label: 'Prescription' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Image' },
  { id: 'OTHER', label: 'Other' },
];

const SERVICE_REPORT_TYPES: Record<string, ReportType[]> = {
  LAB_SAMPLING: ['LAB_RESULT', 'OTHER'],
};

function getAllowedReportTypes(serviceTypeCode: string): { id: ReportType; label: string }[] {
  const allowed = SERVICE_REPORT_TYPES[serviceTypeCode];
  if (!allowed) return ALL_REPORT_TYPES;
  return ALL_REPORT_TYPES.filter((t) => allowed.includes(t.id));
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

interface UploadReportModalProps {
  busy: boolean;
  serviceTypeCode: string;
  onClose: () => void;
  onSubmit: (form: { title: string; reportType: ReportType; file: File }) => Promise<void>;
}

function UploadReportModal({
  busy,
  serviceTypeCode,
  onClose,
  onSubmit,
}: UploadReportModalProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedTypes = getAllowedReportTypes(serviceTypeCode);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>(allowedTypes[0]?.id ?? 'VISIT_NOTE');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');

  const handleFilePick = (): void => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!ALLOWED_MIME.includes(f.type)) {
      setFileError('Only PDF, JPEG, or PNG accepted.');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError('File exceeds max size of 10 MB.');
      return;
    }
    setFileError('');
    setFile(f);
  };

  const canSubmit = title.trim().length > 0 && file !== null && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-ink-200 w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-start justify-between pb-4 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Upload Diagnostic Report</h2>
              <p className="text-xs text-ink-500 mt-0.5">PDF, JPEG, or PNG (up to 10 MB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
              Report Title <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Blood Count (CBC) Results"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
              Classification
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white transition-all cursor-pointer"
            >
              {allowedTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-2xs font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
              Attachment File <span className="text-danger-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleFilePick}
              className="w-full flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all text-xs font-semibold text-ink-600 hover:text-brand-700"
            >
              <Upload className="h-6 w-6 text-brand-500 mb-1" />
              <span>{file ? file.name : 'Click to select report document'}</span>
              <span className="text-2xs font-normal text-ink-400">PDF, JPEG, or PNG up to 10MB</span>
            </button>
            {fileError ? (
              <p className="text-xs text-danger-600 mt-1.5 font-medium">{fileError}</p>
            ) : file ? (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-xs font-semibold text-ink-700 bg-ink-100 rounded-xl hover:bg-ink-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!canSubmit || !file) return;
              void onSubmit({ title: title.trim(), reportType, file });
            }}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload & Attach
          </button>
        </div>
      </div>
    </div>
  );
}
