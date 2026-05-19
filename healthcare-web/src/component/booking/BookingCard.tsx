import { Calendar, MapPin, User, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from '../common/StatusBadge';
import { Card } from '../../constant/Card';
import { formatDateTime, formatCurrency } from '../../helper/format';
import type { BookingStatus } from '../../types/booking.types';

interface BookingCardProps {
  bookingNumber: string;
  status: BookingStatus;
  patientName: string;
  serviceName: string;
  packageName: string;
  scheduledAt: string;
  addressArea: string;
  totalPrice: string;
  currency: string;
  onClick?: () => void;
  highlightUrgency?: boolean;
}

export function BookingCard({
  bookingNumber,
  status,
  patientName,
  serviceName,
  packageName,
  scheduledAt,
  addressArea,
  totalPrice,
  currency,
  onClick,
  highlightUrgency = false,
}: BookingCardProps): JSX.Element {
  return (
    <Card
      hover
      padding="md"
      onClick={onClick}
      className={clsx(
        'cursor-pointer group relative overflow-hidden',
        highlightUrgency && 'ring-2 ring-accent-500/30',
      )}
    >
      {highlightUrgency ? (
        <div className="absolute top-0 right-0 px-3 py-1 bg-accent-500 text-white text-2xs font-bold rounded-bl-xl">
          URGENT
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-2xs font-mono uppercase tracking-wider text-ink-500">{bookingNumber}</p>
          <h3 className="text-lg font-semibold text-ink-900 mt-0.5">{serviceName}</h3>
          <p className="text-sm text-ink-500">{packageName}</p>
        </div>
        <StatusBadge status={status} kind="booking" />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <User className="h-4 w-4 text-ink-400 flex-shrink-0" />
          <span className="font-medium text-ink-800">{patientName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <Calendar className="h-4 w-4 text-ink-400 flex-shrink-0" />
          <span>{formatDateTime(scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <MapPin className="h-4 w-4 text-ink-400 flex-shrink-0" />
          <span className="truncate">{addressArea}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-ink-100">
        <p className="text-lg font-bold text-brand-700">{formatCurrency(totalPrice, currency)}</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
          View details
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
