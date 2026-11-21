import { Check, Clock, Truck, MapPin, AlertCircle, User, Phone, FileText, Download } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateTime, formatTime } from '../../helper/format';
import type { BookingVisit, VisitStatus } from '../../types/booking.types';

interface VisitTimelineProps {
  visits: BookingVisit[];
}

const STATUS_ICON: Record<VisitStatus, JSX.Element> = {
  SCHEDULED: <Clock className="h-4 w-4" />,
  ASSIGNED: <Clock className="h-4 w-4" />,
  EN_ROUTE: <Truck className="h-4 w-4" />,
  CHECKED_IN: <MapPin className="h-4 w-4" />,
  COMPLETED: <Check className="h-4 w-4" />,
  MISSED: <AlertCircle className="h-4 w-4" />,
  CANCELLED: <AlertCircle className="h-4 w-4" />,
};

const NODE_TONE: Record<VisitStatus, string> = {
  SCHEDULED: 'bg-ink-200 text-ink-600',
  ASSIGNED: 'bg-violet-100 text-violet-700',
  EN_ROUTE: 'bg-sky-100 text-sky-700',
  CHECKED_IN: 'bg-brand-100 text-brand-700',
  COMPLETED: 'bg-success-500 text-white',
  MISSED: 'bg-danger-500 text-white',
  CANCELLED: 'bg-ink-300 text-ink-600',
};

export function VisitTimeline({ visits }: VisitTimelineProps): JSX.Element {
  if (visits.length === 0) {
    return (
      <p className="text-sm text-ink-500 italic">No visits scheduled yet.</p>
    );
  }

  return (
    <ol className="relative space-y-6">
      {visits.map((v, idx) => {
        const isLast = idx === visits.length - 1;
        return (
          <li key={v.id} className="relative pl-12">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-4 top-9 bottom-[-1.5rem] w-px bg-ink-200"
              />
            ) : null}
            <div
              className={clsx(
                'absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-card',
                NODE_TONE[v.status],
              )}
            >
              {STATUS_ICON[v.status]}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-ink-900">Visit #{v.sequenceNo}</h4>
              <StatusBadge status={v.status} kind="visit" size="sm" />
            </div>
            <p className="text-sm text-ink-600">
              Scheduled: <span className="font-medium text-ink-800">{formatDateTime(v.scheduledStartAt)}</span>
            </p>
            {v.checkInAt ? (
              <p className="text-xs text-ink-500 mt-1">
                Checked in at {formatTime(v.checkInAt)}
                {v.checkOutAt ? ` · Checked out at ${formatTime(v.checkOutAt)}` : null}
              </p>
            ) : null}

            {v.assignedStaff ? (
              <div className="mt-3 p-3 rounded-xl bg-ink-50 ring-1 ring-ink-100 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-ink-800">
                  <User className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                  <span className="font-semibold">{v.assignedStaff.user.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-600">
                  <Phone className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                  <a
                    href={`tel:${v.assignedStaff.user.phone}`}
                    className="hover:text-brand-700 transition-colors"
                  >
                    {v.assignedStaff.user.phone}
                  </a>
                </div>
              </div>
            ) : null}

            {v.visitNotes ? (
              <div className="mt-2 p-3 rounded-lg bg-ink-50 ring-1 ring-ink-100 text-sm text-ink-700">
                <span className="font-medium text-ink-800">Notes:</span> {v.visitNotes}
              </div>
            ) : null}

            {v.status === 'COMPLETED' ? (
              <div className="mt-3 p-3 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-teal-900 truncate">Clinical Medical Summary (PDF)</p>
                    <p className="text-2xs text-teal-700 truncate">Vitals, clinical notes & digital signature</p>
                  </div>
                </div>
                <a
                  href={`/api/v1/visits/${v.id}/clinical-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </a>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
