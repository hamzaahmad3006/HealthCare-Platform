import clsx from 'clsx';
import { BOOKING_STATUS_CLASS, VISIT_STATUS_CLASS, VERIF_STATUS_CLASS } from '../../constant/colors';
import type { BookingStatus, VisitStatus } from '../../types/booking.types';
import type { VerifStatus } from '../../types/staff.types';

type StatusKind = 'booking' | 'visit' | 'verif';

interface StatusBadgeProps {
  status: BookingStatus | VisitStatus | VerifStatus | string;
  kind: StatusKind;
  size?: 'sm' | 'md';
  className?: string;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, kind, size = 'md', className }: StatusBadgeProps): JSX.Element {
  const map = kind === 'booking' ? BOOKING_STATUS_CLASS : kind === 'visit' ? VISIT_STATUS_CLASS : VERIF_STATUS_CLASS;
  const cls = map[status] ?? 'bg-ink-100 text-ink-700 ring-ink-200';
  const sizeCls = size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset whitespace-nowrap',
        cls,
        sizeCls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {statusLabel(status)}
    </span>
  );
}
