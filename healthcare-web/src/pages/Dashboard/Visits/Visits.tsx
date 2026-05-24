import { useRef, useState } from 'react';
import { Calendar, Navigation, LogIn, LogOut, CheckCircle2, Loader2, X, CalendarX, FileText, ClipboardList, Upload, Star } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime, formatTime } from '../../../helper/format';
import { useVisits } from './useVisits';
import type { UploadReportPayload } from './useVisits';
import type { BookingVisit, VisitStatus } from '../../../types/booking.types';
import type { ReportType } from '../../../types/report.types';

interface VisitRow extends BookingVisit {
  booking?: { bookingNumber: string; customerUserId: string; patientId: string; serviceType?: { code: string } | null; reviews?: { rating: number; reviewText: string | null; createdAt: string }[] };
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

interface UploadModalState {
  visitId: string;
  bookingId: string;
  patientId: string;
  serviceTypeCode: string;
}

function hasAnyNotes(row: BookingVisit): boolean {
  return Boolean(
    row.beforeConditionText || row.afterConditionText || row.visitNotes || row.checkInAt,
  );
}

export function Visits(): JSX.Element {
  const v = useVisits();
  const [modal, setModal] = useState<ActionModalState | null>(null);
  const [detailsVisit, setDetailsVisit] = useState<VisitRow | null>(null);
  const [uploadModal, setUploadModal] = useState<UploadModalState | null>(null);

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

        if (hasAnyNotes(row)) {
          buttons.push(
            <ActionButton
              key="details"
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Details"
              busy={false}
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
              variant="primary"
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
          return <span className="text-2xs text-ink-400">—</span>;
        }

        return <div className="inline-flex gap-2 justify-end flex-wrap">{buttons}</div>;
      },
    },
  ];

  return (
    <SidebarLayout title="Visits" description="Track check-ins and visit progress in real time">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            <Calendar className="h-3 w-3 inline mr-1" />
            Date
          </label>
          <div className="inline-flex items-center gap-2">
            <input
              type="date"
              value={v.dateFilter}
              onChange={(e) => v.setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
            />
            <button
              onClick={() => {
                v.setDateFilter('');
                v.setStatusFilter('ALL');
              }}
              disabled={!v.dateFilter && v.statusFilter === 'ALL'}
              title="Show every visit on every date"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white ring-1 ring-ink-200 text-ink-700 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CalendarX className="h-3.5 w-3.5" />
              Show all
            </button>
          </div>
        </div>
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            Status
          </label>
          <div className="bg-white rounded-xl ring-1 ring-ink-200 p-1 flex gap-1 flex-wrap overflow-x-auto">
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

      {detailsVisit ? (
        <DetailsModal visit={detailsVisit} onClose={() => setDetailsVisit(null)} />
      ) : null}

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

// ── Internal: details modal — read-only view of saved notes & timestamps ─────
interface DetailsModalProps {
  visit: VisitRow;
  onClose: () => void;
}

function DetailsModal({ visit, onClose }: DetailsModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-ink-200 w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-brand-600" />
              Visit details
            </h2>
            <p className="text-xs text-ink-500 mt-0.5 font-mono">
              {visit.booking?.bookingNumber ?? '—'} · Visit #{visit.sequenceNo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="Scheduled" value={formatDateTime(visit.scheduledStartAt)} />

          <div className="grid grid-cols-2 gap-3">
            <DetailRow
              label="Checked in"
              value={visit.checkInAt ? formatDateTime(visit.checkInAt) : '—'}
            />
            <DetailRow
              label="Checked out"
              value={visit.checkOutAt ? formatDateTime(visit.checkOutAt) : '—'}
            />
          </div>

          <NoteBlock
            label="Patient condition on arrival"
            value={visit.beforeConditionText}
          />
          <NoteBlock
            label="Patient condition on departure"
            value={visit.afterConditionText}
          />
          <NoteBlock label="Visit notes" value={visit.visitNotes} />

          {visit.status === 'COMPLETED' && visit.booking?.reviews?.length ? (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Customer review</p>
              <div className="flex gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= (visit.booking!.reviews![0]?.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
                ))}
              </div>
              {visit.booking.reviews[0]?.reviewText ? (
                <p className="text-sm text-ink-700 bg-ink-50 ring-1 ring-ink-100 rounded-xl px-3 py-2 leading-relaxed">
                  {visit.booking.reviews[0].reviewText}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-ink-700 rounded-xl hover:bg-ink-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-sm text-ink-800 mt-0.5">{value}</p>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string | null }): JSX.Element {
  return (
    <div>
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</p>
      {value ? (
        <p className="text-sm text-ink-800 whitespace-pre-wrap bg-ink-50 ring-1 ring-ink-100 rounded-xl px-3 py-2 leading-relaxed">
          {value}
        </p>
      ) : (
        <p className="text-sm text-ink-400 italic">Not recorded</p>
      )}
    </div>
  );
}

// ── Internal: upload report modal ───────────────────────────────────────────
const ALL_REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: 'VISIT_NOTE', label: 'Visit Note' },
  { id: 'LAB_RESULT', label: 'Lab Result' },
  { id: 'PRESCRIPTION', label: 'Prescription' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Image' },
  { id: 'OTHER', label: 'Other' },
];

// Which report types are relevant per service type
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

function UploadReportModal({ busy, serviceTypeCode, onClose, onSubmit }: UploadReportModalProps): JSX.Element {
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
      setFileError('File is too large. Max 10 MB.');
      return;
    }
    setFileError('');
    setFile(f);
  };

  const canSubmit = title.trim().length > 0 && file !== null && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl ring-1 ring-ink-200 w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Upload Report</h2>
            <p className="text-xs text-ink-500 mt-0.5">PDF, JPEG, or PNG · up to 10 MB</p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1.5">
              Report title <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood Test Results — 22 May"
              className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
          </div>

          <div>
            <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1.5">
              Report type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
            >
              {allowedTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1.5">
              File <span className="text-danger-500">*</span>
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all text-sm font-medium text-ink-600 hover:text-brand-700"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Choose file'}
            </button>
            {fileError ? (
              <p className="text-xs text-danger-600 mt-1">{fileError}</p>
            ) : file ? (
              <p className="text-xs text-success-600 mt-1">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            ) : null}
          </div>
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
            onClick={() => {
              if (!canSubmit || !file) return;
              void onSubmit({ title: title.trim(), reportType, file });
            }}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
        </div>
      </div>
    </div>
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
