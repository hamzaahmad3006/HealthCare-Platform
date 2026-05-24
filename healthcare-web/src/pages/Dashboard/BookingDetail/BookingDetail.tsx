import { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, User, Phone, CheckCircle2, XCircle, UserPlus, Star, Banknote, CalendarClock } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { StaffAssignPanel } from '../../../component/booking/StaffAssignPanel';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { Card } from '../../../constant/Card';
import { Button } from '../../../constant/Button';
import { formatCurrency, formatDateTime, formatTime } from '../../../helper/format';
import { useAdminBookingDetail } from './useBookingDetail';

export function AdminBookingDetail(): JSX.Element {
  const d = useAdminBookingDetail();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');

  if (d.isLoading || !d.booking) {
    return (
      <SidebarLayout title="Booking detail">
        <LoadingSpinner size="lg" label="Loading booking…" className="py-20" />
      </SidebarLayout>
    );
  }

  const b = d.booking;
  const canConfirm = b.status === 'PENDING';
  const canCancel = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'].includes(b.status);
  const canReschedule = ['CONFIRMED', 'ASSIGNED'].includes(b.status);

  return (
    <SidebarLayout
      title={b.bookingNumber}
      description={`${b.serviceType.name} · ${b.package.name}`}
      actions={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={d.goBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          {canConfirm ? (
            <Button
              size="sm"
              onClick={() => void d.handleConfirm()}
              isLoading={d.isConfirming}
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Confirm
            </Button>
          ) : null}
          {canReschedule ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRescheduleModal(true)}
              leftIcon={<CalendarClock className="h-4 w-4" />}
            >
              Reschedule
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              leftIcon={<XCircle className="h-4 w-4" />}
            >
              Cancel
            </Button>
          ) : null}
        </>
      }
    >
      {/* Header status row */}
      <Card variant="elevated" padding="lg" className="mb-6 animate-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <StatusBadge status={b.status} kind="booking" />
            <p className="text-sm text-ink-600 mt-3">
              Created {formatDateTime(b.createdAt)}
              {b.confirmedAt ? ` · Confirmed ${formatDateTime(b.confirmedAt)}` : ''}
            </p>
          </div>
          <p className="text-3xl font-bold text-brand-700">{formatCurrency(b.totalPrice, b.currency)}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Customer & patient</h3>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">{b.patient.fullName}</p>
                {b.patient.relationshipToCustomer ? (
                  <p className="text-xs text-ink-500 mt-0.5">{b.patient.relationshipToCustomer}</p>
                ) : null}
                {b.patient.primaryCondition ? (
                  <p className="text-xs text-ink-500 mt-1">Condition: {b.patient.primaryCondition}</p>
                ) : null}
                {b.patient.allergies ? (
                  <p className="text-xs text-warning-700 mt-1">Allergies: {b.patient.allergies}</p>
                ) : null}
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Service address</h3>
            <div className="flex items-start gap-3 text-sm">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">{b.address.line1}</p>
                {b.address.line2 ? <p className="text-ink-600">{b.address.line2}</p> : null}
                <p className="text-ink-600">
                  {b.address.area}, {b.city.name}
                </p>
                <p className="text-xs text-ink-500 mt-2 inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {b.address.contactPhone}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-4">Schedule</h3>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink-900">{formatDateTime(b.requestedStartAt)}</p>
                <p className="text-xs text-ink-500 mt-1">Urgency: {b.urgencyLevel.toLowerCase()}</p>
                {b.preferredStaffGender ? (
                  <p className="text-xs text-ink-500">Preferred gender: {b.preferredStaffGender.toLowerCase()}</p>
                ) : null}
              </div>
            </div>
          </Card>

          {b.specialInstructions ? (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-ink-800 mb-2">Instructions</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{b.specialInstructions}</p>
            </Card>
          ) : null}

          {b.payments?.[0] ? (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-ink-800 mb-3">Payment</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">
                    {b.payments[0].paymentMethod === 'CASH' ? 'Cash on Visit' : b.payments[0].paymentMethod}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    b.payments[0].status === 'PAID'
                      ? 'bg-success-50 text-success-700'
                      : 'bg-warning-50 text-warning-700'
                  }`}>
                    {b.payments[0].status === 'PAID' ? 'Collected' : 'Pending Collection'}
                  </span>
                </div>
              </div>
              {b.payments[0].status === 'PENDING' && b.payments[0].paymentMethod === 'CASH' ? (
                <Button
                  size="sm"
                  fullWidth
                  onClick={() => void d.handleMarkPaid()}
                  isLoading={d.isMarkingPaid}
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Mark as Collected
                </Button>
              ) : null}
            </Card>
          ) : null}
        </div>

        {/* Right — visits with assign per visit */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-ink-900 mb-6">
              Visits ({b.visits.length})
            </h2>
            <ul className="space-y-3">
              {b.visits.map((v) => (
                <li
                  key={v.id}
                  className="p-4 rounded-xl ring-1 ring-ink-100 hover:ring-ink-200 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">Visit #{v.sequenceNo}</p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        Scheduled: {formatDateTime(v.scheduledStartAt)}
                      </p>
                      {v.checkInAt ? (
                        <p className="text-xs text-ink-500">
                          Checked in {formatTime(v.checkInAt)}
                          {v.checkOutAt ? ` · Out ${formatTime(v.checkOutAt)}` : ''}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={v.status} kind="visit" />
                      {(v.status === 'SCHEDULED' || v.status === 'ASSIGNED') && b.status !== 'CANCELLED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void d.openAssignPanel(v.id)}
                          leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                        >
                          {v.assignedStaffUserId ? 'Reassign' : 'Assign'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {(v.beforeConditionText || v.afterConditionText || v.visitNotes) ? (
                    <div className="mt-3 space-y-2">
                      {v.beforeConditionText ? (
                        <div className="p-3 rounded-lg bg-ink-50 text-sm text-ink-700">
                          <span className="font-medium text-ink-800">Condition on arrival: </span>
                          {v.beforeConditionText}
                        </div>
                      ) : null}
                      {v.afterConditionText ? (
                        <div className="p-3 rounded-lg bg-ink-50 text-sm text-ink-700">
                          <span className="font-medium text-ink-800">Condition on departure: </span>
                          {v.afterConditionText}
                        </div>
                      ) : null}
                      {v.visitNotes ? (
                        <div className="p-3 rounded-lg bg-ink-50 text-sm text-ink-700">
                          <span className="font-medium text-ink-800">Visit notes: </span>
                          {v.visitNotes}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {b.reviews?.length ? (
        <Card padding="md" className="mt-6">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">Customer review</h3>
          <div className="flex gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-5 w-5 ${s <= b.reviews[0].rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
            ))}
            <span className="ml-2 text-sm font-semibold text-ink-700">{b.reviews[0].rating} / 5</span>
          </div>
          {b.reviews[0].reviewText ? (
            <p className="text-sm text-ink-700 leading-relaxed">{b.reviews[0].reviewText}</p>
          ) : null}
          <p className="text-xs text-ink-400 mt-2">{b.reviews[0].createdAt ? new Date(b.reviews[0].createdAt).toLocaleString() : ''}</p>
        </Card>
      ) : null}

      <StaffAssignPanel
        open={d.assignPanelOpen}
        onClose={d.closeAssignPanel}
        staffList={d.eligibleStaff}
        isLoading={d.loadingStaff}
        assigningStaffId={d.assigningStaffId}
        onAssign={d.handleAssign}
      />

      {showCancelModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm animate-fade-in">
          <Card variant="elevated" padding="lg" className="max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-ink-900">Cancel this booking?</h3>
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
                  await d.handleCancel(cancelReason || 'Cancelled by admin');
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

      {showRescheduleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm animate-fade-in">
          <Card variant="elevated" padding="lg" className="max-w-md w-full animate-scale-in">
            <h3 className="text-lg font-bold text-ink-900">Reschedule booking</h3>
            <p className="text-sm text-ink-500 mt-1">Pick the new start date and time.</p>
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
    </SidebarLayout>
  );
}
