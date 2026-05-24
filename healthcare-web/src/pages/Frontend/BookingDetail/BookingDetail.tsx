import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calendar, MapPin, User, Phone, AlertCircle, Star, Banknote, Clock, CheckCircle2, XCircle, CalendarClock } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Card } from '../../../constant/Card';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { VisitTimeline } from '../../../component/booking/VisitTimeline';
import { TopNav } from '../../../component/common/TopNav';
import { formatCurrency, formatDateTime } from '../../../helper/format';
import { useBookingDetail, type ReviewFormData } from './useBookingDetail';

export function BookingDetail(): JSX.Element {
  const d = useBookingDetail();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

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
      <TopNav />

      <main className="max-w-5xl mx-auto px-6 py-8 animate-slide-up">
        <Button
          variant="ghost"
          size="sm"
          onClick={d.goBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back to my bookings
        </Button>
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

        {/* PENDING_DOCTOR banner */}
        {b.status === 'PENDING_DOCTOR' ? (
          <div className="mb-6 p-4 rounded-xl bg-purple-50 ring-1 ring-purple-200 flex items-start gap-3">
            <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-purple-800">Waiting for doctor confirmation</p>
              <p className="text-sm text-purple-700 mt-0.5">
                The doctor will review your request and either accept or propose a new time.
              </p>
            </div>
          </div>
        ) : null}

        {/* TIME_PROPOSED banner */}
        {b.status === 'TIME_PROPOSED' && b.proposedStartAt ? (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 ring-1 ring-orange-200">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800">Doctor proposed a new time</p>
                <p className="text-sm text-orange-700 mt-0.5">
                  The doctor is available at <strong>{formatDateTime(b.proposedStartAt)}</strong>.
                  Do you accept this new time?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => void d.handleAcceptTime()}
                isLoading={d.isActingOnTime}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Accept new time
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void d.handleDeclineTime()}
                isLoading={d.isActingOnTime}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Decline
              </Button>
            </div>
          </div>
        ) : null}

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

            {b.payments?.[0] ? (
              <Card padding="md">
                <h3 className="text-sm font-semibold text-ink-800 mb-3">Payment</h3>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">
                      {b.payments[0].paymentMethod === 'CASH' ? 'Cash on Visit' : b.payments[0].paymentMethod}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      b.payments[0].status === 'PAID'
                        ? 'bg-success-50 text-success-700'
                        : 'bg-warning-50 text-warning-700'
                    }`}>
                      {b.payments[0].status === 'PAID' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </Card>
            ) : null}

            {d.canReschedule ? (
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowRescheduleModal(true)}
                leftIcon={<CalendarClock className="h-4 w-4" />}
              >
                Reschedule booking
              </Button>
            ) : null}
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

            {b.status === 'COMPLETED' ? (
              <ReviewSection
                existingReview={b.reviews?.[0] ?? null}
                isSubmitting={d.isSubmittingReview}
                onSubmit={d.handleReview}
              />
            ) : null}
          </div>
        </div>
      </main>

      {/* Reschedule modal */}
      {showRescheduleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm animate-fade-in">
          <Card variant="elevated" padding="lg" className="max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-ink-900">Reschedule booking</h3>
            <p className="text-sm text-ink-500 mt-1">Choose a new preferred date and time.</p>
            <input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-4 w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => { setShowRescheduleModal(false); setRescheduleDate(''); }}
                disabled={d.isRescheduling}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await d.handleReschedule(new Date(rescheduleDate).toISOString());
                  setShowRescheduleModal(false);
                  setRescheduleDate('');
                }}
                isLoading={d.isRescheduling}
                disabled={!rescheduleDate}
                leftIcon={<CalendarClock className="h-4 w-4" />}
              >
                Confirm reschedule
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }): JSX.Element {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-ink-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSection({
  existingReview,
  isSubmitting,
  onSubmit,
}: {
  existingReview: { rating: number; reviewText: string | null; createdAt: string } | null;
  isSubmitting: boolean;
  onSubmit: (data: ReviewFormData) => Promise<void>;
}): JSX.Element {
  const { register, handleSubmit, watch, setValue } = useForm<ReviewFormData>({ defaultValues: { rating: 0 } });
  const rating = watch('rating');

  if (existingReview) {
    return (
      <Card padding="md" className="mt-6">
        <h3 className="text-sm font-semibold text-ink-800 mb-3">Your review</h3>
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`h-5 w-5 ${s <= existingReview.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
          ))}
        </div>
        {existingReview.reviewText && (
          <p className="text-sm text-ink-600 leading-relaxed">{existingReview.reviewText}</p>
        )}
        <p className="text-xs text-ink-400 mt-2">{formatDateTime(existingReview.createdAt)}</p>
      </Card>
    );
  }

  return (
    <Card padding="md" className="mt-6">
      <h3 className="text-sm font-semibold text-ink-800 mb-1">Rate this visit</h3>
      <p className="text-xs text-ink-500 mb-4">How was your experience?</p>
      <form onSubmit={handleSubmit((data) => void onSubmit(data))} className="space-y-4">
        <StarPicker value={rating} onChange={(v) => setValue('rating', v)} />
        <textarea
          {...register('reviewText')}
          rows={3}
          placeholder="Tell us about your experience (optional)…"
          className="w-full px-3 py-2.5 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={rating === 0}
          leftIcon={<Star className="h-4 w-4" />}
        >
          Submit review
        </Button>
      </form>
    </Card>
  );
}
