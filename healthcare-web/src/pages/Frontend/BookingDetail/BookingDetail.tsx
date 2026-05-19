import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Phone, Heart, AlertCircle } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Card } from '../../../constant/Card';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { VisitTimeline } from '../../../component/booking/VisitTimeline';
import { formatCurrency, formatDateTime } from '../../../helper/format';
import { useBookingDetail } from './useBookingDetail';

export function BookingDetail(): JSX.Element {
  const d = useBookingDetail();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (d.isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading booking…" />
      </div>
    );
  }

  if (d.error || !d.booking) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-6">
        <Card padding="lg" className="max-w-md text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-danger-500" />
          <h2 className="mt-4 text-xl font-bold text-ink-900">Booking not found</h2>
          <p className="mt-2 text-sm text-ink-500">{d.error ?? 'This booking may have been removed.'}</p>
          <Button onClick={d.goBack} className="mt-6">
            Back to my bookings
          </Button>
        </Card>
      </div>
    );
  }

  const b = d.booking;

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
              <Heart className="h-4 w-4" fill="currentColor" />
            </div>
            <p className="font-bold text-ink-900">HomeHealth</p>
          </Link>
          <Button variant="ghost" size="sm" onClick={d.goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 animate-slide-up">
        {/* Header card */}
        <Card variant="elevated" padding="lg" className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-ink-500">{b.bookingNumber}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-1">{b.serviceType.name}</h1>
              <p className="text-ink-600 mt-1">{b.package.name}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={b.status} kind="booking" />
              <p className="text-2xl font-bold text-brand-700">
                {formatCurrency(b.totalPrice, b.currency)}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — details */}
          <div className="lg:col-span-1 space-y-6">
            <Card padding="md">
              <h3 className="text-sm font-semibold text-ink-800 mb-4">Patient</h3>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{b.patient.fullName}</p>
                  {b.patient.relationshipToCustomer ? (
                    <p className="text-xs text-ink-500 mt-0.5">
                      {b.patient.relationshipToCustomer}
                    </p>
                  ) : null}
                  {b.patient.primaryCondition ? (
                    <p className="text-xs text-ink-500 mt-1">
                      Condition: {b.patient.primaryCondition}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-semibold text-ink-800 mb-4">Service address</h3>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-ink-900">{b.address.line1}</p>
                  {b.address.line2 ? <p className="text-ink-600">{b.address.line2}</p> : null}
                  <p className="text-ink-600">{b.address.area}</p>
                  <p className="text-ink-600">{b.city.name}</p>
                  <p className="text-xs text-ink-500 mt-2 inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {b.address.contactPhone}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-semibold text-ink-800 mb-4">Scheduled</h3>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{formatDateTime(b.requestedStartAt)}</p>
                  <p className="text-xs text-ink-500 mt-1">Urgency: {b.urgencyLevel.toLowerCase()}</p>
                </div>
              </div>
            </Card>

            {d.canCancel ? (
              <Button variant="outline" fullWidth onClick={() => setShowCancelModal(true)}>
                Cancel booking
              </Button>
            ) : null}
          </div>

          {/* Right — visits timeline */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-ink-900 mb-6">
                Visit schedule ({b.visits.length})
              </h2>
              <VisitTimeline visits={b.visits} />
            </Card>

            {b.specialInstructions ? (
              <Card padding="md" className="mt-6">
                <h3 className="text-sm font-semibold text-ink-800 mb-2">Special instructions</h3>
                <p className="text-sm text-ink-700 leading-relaxed">{b.specialInstructions}</p>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      {/* Cancel modal */}
      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm animate-fade-in">
          <Card variant="elevated" padding="lg" className="max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-ink-900">Cancel this booking?</h3>
            <p className="text-sm text-ink-500 mt-1">This cannot be undone.</p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
              className="mt-4 w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20 outline-none resize-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(false)}
                disabled={d.isCancelling}
              >
                Keep booking
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  await d.handleCancel(cancelReason || 'Cancelled by customer');
                  setShowCancelModal(false);
                }}
                isLoading={d.isCancelling}
                disabled={cancelReason.trim().length === 0}
              >
                Confirm cancel
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
