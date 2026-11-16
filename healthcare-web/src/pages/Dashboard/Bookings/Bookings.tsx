import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  CheckCircle2,
  UserPlus,
  Search,
  CalendarClock,
  AlertTriangle,
  Stethoscope,
  Activity,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Plus,
  ChevronRight,
  UserSquare2,
  Filter,
  Check,
  MapPin,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { StaffAssignPanel } from '../../../component/booking/StaffAssignPanel';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Button } from '../../../constant/Button';
import { formatDateTime, formatCurrency, formatRelative } from '../../../helper/format';
import { useBookings } from './useBookings';
import type { Booking, BookingStatus } from '../../../types/booking.types';

interface BookingRow extends Booking {
  patient?: { fullName: string };
  serviceType?: { code: string; name: string };
  package?: { name: string };
}

const TABS: { id: BookingStatus | 'ALL'; label: string; tone?: string }[] = [
  { id: 'ALL', label: 'All Bookings' },
  { id: 'PENDING_DOCTOR', label: 'Doctor Requests' },
  { id: 'PENDING', label: 'Pending Dispatch' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'ASSIGNED', label: 'Assigned Staff' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export function Bookings(): JSX.Element {
  const b = useBookings();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter bookings based on live search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return b.bookings;
    const q = searchQuery.toLowerCase();
    return b.bookings.filter((row) => {
      const matchNum = row.bookingNumber?.toLowerCase().includes(q);
      const matchPatient = row.patient?.fullName?.toLowerCase().includes(q);
      const matchService = row.serviceType?.name?.toLowerCase().includes(q);
      const matchPkg = row.package?.name?.toLowerCase().includes(q);
      return matchNum || matchPatient || matchService || matchPkg;
    });
  }, [b.bookings, searchQuery]);

  // Operational mini metrics computed from current data batch
  const pendingCount = useMemo(
    () => b.bookings.filter((r) => r.status === 'PENDING' || r.status === 'PENDING_DOCTOR').length,
    [b.bookings],
  );
  const inProgressCount = useMemo(
    () => b.bookings.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length,
    [b.bookings],
  );
  const urgentCount = useMemo(
    () => b.bookings.filter((r) => r.urgencyLevel === 'URGENT' || r.urgencyLevel === 'EMERGENCY').length,
    [b.bookings],
  );

  return (
    <SidebarLayout
      title="Booking & Triage Desk"
      description="Real-time patient appointments, clinical triage, and staff dispatch management"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/visits"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Activity className="h-3.5 w-3.5 text-brand-600" />
            <span>Field Visits</span>
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-brand hover:brightness-105 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Booking</span>
          </Link>
        </div>
      }
    >
      {/* ───── Top Operational Metric Strip ───── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fade-in-up">
        {/* Metric 1: Total Queue */}
        <div className="rounded-2xl bg-white border border-ink-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Total in Queue</span>
            <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-ink-950">
              {b.meta?.total ?? b.bookings.length}
            </span>
            <span className="text-2xs text-ink-500 font-medium">appointments</span>
          </div>
        </div>

        {/* Metric 2: Awaiting Triage */}
        <div className="rounded-2xl bg-white border border-ink-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-warning-700">Needs Triage</span>
            <div className="h-8 w-8 rounded-xl bg-warning-50 text-warning-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-ink-950">{pendingCount}</span>
            <span className="text-2xs text-warning-700 font-semibold">awaiting action</span>
          </div>
        </div>

        {/* Metric 3: Active in Field */}
        <div className="rounded-2xl bg-white border border-ink-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-accent-700">En Route / Active</span>
            <div className="h-8 w-8 rounded-xl bg-accent-50 text-accent-700 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-ink-950">{inProgressCount}</span>
            <span className="text-2xs text-accent-700 font-semibold">field visits</span>
          </div>
        </div>

        {/* Metric 4: Urgent Requests */}
        <div className="rounded-2xl bg-white border border-ink-100 p-4 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-danger-700">Priority Urgency</span>
            <div className="h-8 w-8 rounded-xl bg-danger-50 text-danger-700 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-ink-950">{urgentCount}</span>
            <span className="text-2xs text-danger-700 font-semibold">&lt; 60m response</span>
          </div>
        </div>
      </div>

      {b.error ? (
        <div className="mb-6 p-4 rounded-2xl bg-danger-50 border border-danger-200 text-xs sm:text-sm text-danger-800 flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-danger-600 flex-shrink-0" />
            <span>{b.error}</span>
          </div>
        </div>
      ) : null}

      {/* ───── Table Hub Container ───── */}
      <div className="bg-white rounded-3xl border border-ink-100 shadow-card overflow-hidden animate-fade-in-up">
        {/* Controls Toolbar: Status Tabs & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-ink-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Scrollable Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 lg:pb-0">
            {TABS.map((t) => {
              const active = b.activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => b.setTab(t.id)}
                  className={clsx(
                    'px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150',
                    active
                      ? 'bg-brand-700 text-white shadow-brand scale-100'
                      : 'bg-ink-50/70 text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative flex-shrink-0 w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, patient, service..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-ink-200 bg-ink-50/50 text-xs text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        {b.isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl bg-gradient-to-r from-ink-100 via-ink-50 to-ink-100 bg-[length:200%_100%] animate-shimmer"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No bookings found"
              description={
                searchQuery
                  ? `No appointments match "${searchQuery}". Try a different term or clear the search.`
                  : b.activeTab === 'ALL'
                  ? 'New bookings will appear here.'
                  : `No bookings currently in "${b.activeTab.replace(/_/g, ' ')}" status.`
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Booking Reference &amp; Service
                  </th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Patient Profile
                  </th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Scheduled Slot
                  </th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400">
                    Dispatch Status
                  </th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400 text-right">
                    Total Fee
                  </th>
                  <th className="px-5 py-3 text-2xs font-bold uppercase tracking-wider text-ink-400 text-right">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredBookings.map((row) => {
                  const patientName = row.patient?.fullName ?? 'Patient';
                  const patientInitial = patientName.charAt(0).toUpperCase() || 'P';
                  const isUrgent = row.urgencyLevel === 'URGENT' || row.urgencyLevel === 'EMERGENCY';

                  return (
                    <tr
                      key={row.id}
                      onClick={() => b.openBooking(row.id)}
                      className="hover:bg-brand-50/30 transition-colors group cursor-pointer"
                    >
                      {/* Booking Code & Service */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-ink-900 group-hover:text-brand-800 transition-colors truncate">
                                {row.serviceType?.name ?? 'Healthcare Service'}
                              </p>
                              {row.package?.name && (
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-ink-100 text-ink-600">
                                  {row.package.name}
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-2xs text-ink-400 mt-0.5">
                              #{row.bookingNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-ink-100 text-ink-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {patientInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-ink-900 truncate">
                              {patientName}
                            </p>
                            {isUrgent ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-danger-100 text-danger-700 animate-pulse mt-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {row.urgencyLevel}
                              </span>
                            ) : (
                              <span className="text-2xs text-ink-400">Regular Priority</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-ink-800">
                          {formatDateTime(row.requestedStartAt)}
                        </p>
                        <p className="text-2xs text-ink-400 mt-0.5">
                          {formatRelative(row.requestedStartAt)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} kind="booking" size="sm" />
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-right font-extrabold text-xs sm:text-sm text-ink-900">
                        {formatCurrency(row.totalPrice, row.currency)}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {['PENDING', 'RESCHEDULED'].includes(row.status) ? (
                            <Button
                              size="sm"
                              onClick={() => void b.handleConfirm(row.id)}
                              isLoading={b.confirmingId === row.id}
                              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xs py-1.5 px-3 rounded-xl shadow-xs"
                            >
                              Confirm
                            </Button>
                          ) : null}

                          {row.status === 'CONFIRMED' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => b.openBooking(row.id)}
                              leftIcon={<UserPlus className="h-3.5 w-3.5 text-brand-600" />}
                              className="text-brand-800 border-brand-300 hover:bg-brand-50 font-bold text-2xs py-1.5 px-3 rounded-xl"
                            >
                              Assign
                            </Button>
                          ) : null}

                          <button
                            onClick={() => b.openBooking(row.id)}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-brand-700 hover:bg-ink-100 transition-colors inline-flex items-center"
                            title="Manage booking"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {b.meta && b.meta.total > b.meta.limit ? (
          <div className="p-4 border-t border-ink-100 bg-ink-50/30">
            <Pagination meta={b.meta} onPageChange={b.setPageNum} />
          </div>
        ) : null}
      </div>

      {/* Staff Assignment Modal */}
      <StaffAssignPanel
        open={b.assignPanelOpen}
        onClose={b.closeAssignPanel}
        staffList={b.eligibleStaff}
        isLoading={b.loadingStaff}
        assigningStaffId={b.assigningStaffId}
        onAssign={b.handleAssign}
      />
    </SidebarLayout>
  );
}
