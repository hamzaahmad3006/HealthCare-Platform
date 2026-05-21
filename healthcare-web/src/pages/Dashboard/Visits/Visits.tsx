import { useState } from 'react';
import { Calendar, Navigation, LogIn, LogOut, CheckCircle2, Loader2, X } from 'lucide-react';
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

type ModalMode = 'check-in' | 'check-out';

interface ActionModalState {
  mode: ModalMode;
  visitId: string;
}

export function Visits(): JSX.Element {
  const v = useVisits();
  const [modal, setModal] = useState<ActionModalState | null>(null);

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
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const busy = v.actionLoadingId === row.id;
        const buttons: JSX.Element[] = [];

        if (row.status === 'ASSIGNED' || row.status === 'SCHEDULED') {
          buttons.push(
            <ActionButton
              key="en-route"
              icon={<Navigation className="h-3.5 w-3.5" />}
              label="Start"
              busy={busy}
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
              busy={busy}
              onClick={() => setModal({ mode: 'check-out', visitId: row.id })}
            />,
          );
        }

        if (row.status === 'CHECKED_IN' && row.checkOutAt) {
          buttons.push(
            <ActionButton
              key="complete"
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Complete"
              variant="primary"
              busy={busy}
              onClick={() => void v.handleComplete(row.id)}
            />,
          );
        }

        if (buttons.length === 0) {
          return <span className="text-2xs text-ink-400">—</span>;
        }

        return <div className="inline-flex gap-2 justify-end">{buttons}</div>;
      },
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
    </SidebarLayout>
  );
}

// ── Internal: action button ──────────────────────────────────────────────────
interface ActionButtonProps {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  busy?: boolean;
  variant?: 'primary' | 'ghost';
}

function ActionButton({ icon, label, onClick, busy, variant = 'ghost' }: ActionButtonProps): JSX.Element {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const cls =
    variant === 'primary'
      ? `${base} bg-brand-600 text-white hover:bg-brand-700`
      : `${base} bg-ink-100 text-ink-700 hover:bg-ink-200`;
  return (
    <button onClick={onClick} disabled={busy} className={cls}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ── Internal: check-in / check-out modal ─────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-ink-200 w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">
              {isCheckIn ? 'Check In' : 'Check Out'}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {isCheckIn
                ? "We'll capture your current location to confirm arrival."
                : "Capture location and finish up with notes for the customer."}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1.5">
              {isCheckIn ? 'Patient condition on arrival' : 'Patient condition on departure'}
              <span className="font-normal lowercase ml-1 text-ink-400">(optional)</span>
            </label>
            <textarea
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              rows={3}
              placeholder={isCheckIn ? 'e.g. Patient alert, BP slightly elevated' : 'e.g. Patient resting, vitals stable'}
              className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
            />
          </div>

          {!isCheckIn ? (
            <div>
              <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1.5">
                Visit notes <span className="font-normal lowercase text-ink-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="What was done during the visit?"
                className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-ink-700 rounded-xl hover:bg-ink-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void onSubmit({ condition: condition.trim(), notes: notes.trim() })}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isCheckIn ? 'Confirm Check In' : 'Confirm Check Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
