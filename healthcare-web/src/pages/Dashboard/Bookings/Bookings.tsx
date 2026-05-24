import clsx from 'clsx';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { StaffAssignPanel } from '../../../component/booking/StaffAssignPanel';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { Button } from '../../../constant/Button';
import { formatDateTime, formatCurrency } from '../../../helper/format';
import { useBookings } from './useBookings';
import type { Booking, BookingStatus } from '../../../types/booking.types';

interface BookingRow extends Booking {
  patient?: { fullName: string };
  serviceType?: { code: string; name: string };
  package?: { name: string };
}

const TABS: { id: BookingStatus | 'ALL'; label: string }[] = [
  { id: 'PENDING_DOCTOR', label: 'Doctor' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'ALL', label: 'All' },
];

export function Bookings(): JSX.Element {
  const b = useBookings();

  const columns: ColumnDef<BookingRow>[] = [
    {
      key: 'booking',
      header: 'Booking',
      render: (row) => (
        <div>
          <p className="font-mono text-2xs text-ink-500">{row.bookingNumber}</p>
          <p className="font-semibold text-ink-900 mt-0.5">{row.serviceType?.name ?? '—'}</p>
          <p className="text-2xs text-ink-500">{row.package?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.patient?.fullName ?? '—'}</p>
          {row.urgencyLevel !== 'NORMAL' ? (
            <span className="text-2xs font-bold text-accent-600 mt-0.5 inline-block">
              {row.urgencyLevel}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      render: (row) => (
        <span className="text-ink-700 text-sm">{formatDateTime(row.requestedStartAt)}</span>
      ),
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'PENDING' ? (
            <Button
              size="sm"
              onClick={() => void b.handleConfirm(row.id)}
              isLoading={b.confirmingId === row.id}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Confirm
            </Button>
          ) : null}
          {row.status === 'CONFIRMED' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => b.openBooking(row.id)}
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            >
              Assign
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <SidebarLayout title="Bookings" description="Confirm, assign, and track all bookings">
      <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-1.5 flex gap-1 shadow-card overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => b.setTab(t.id)}
            className={clsx(
              'px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all',
              b.activeTab === t.id
                ? 'bg-gradient-brand text-white shadow-brand'
                : 'text-ink-600 hover:text-ink-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {b.error ? (
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {b.error}
        </div>
      ) : null}

      <Card padding="none" className="mt-6 overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={b.bookings}
          rowKey={(row) => row.id}
          onRowClick={(row) => b.openBooking(row.id)}
          isLoading={b.isLoading}
          emptyState={
            <EmptyState
              title="No bookings here"
              description={
                b.activeTab === 'ALL'
                  ? 'New bookings will appear here.'
                  : `No bookings with status ${b.activeTab.toLowerCase()}.`
              }
            />
          }
        />
        {b.meta ? <Pagination meta={b.meta} onPageChange={b.setPageNum} /> : null}
      </Card>

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
