import { useCallback, useEffect, useState } from 'react';
import { Clock, CheckCircle2, Calendar, UserSquare2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { EmptyState } from '../../../component/common/EmptyState';
import { Card } from '../../../constant/Card';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { formatDateTime, formatCurrency } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';

interface DoctorBooking {
  id: string;
  bookingNumber: string;
  status: 'PENDING_DOCTOR' | 'TIME_PROPOSED';
  requestedStartAt: string;
  proposedStartAt: string | null;
  totalPrice: string;
  currency: string;
  urgencyLevel: string;
  specialInstructions: string | null;
  patient: { fullName: string; primaryCondition: string | null };
  package: { name: string };
  city: { name: string };
}

export function DoctorRequests(): JSX.Element {
  const [requests, setRequests] = useState<DoctorBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [proposeModal, setProposeModal] = useState<string | null>(null);
  const [proposedTime, setProposedTime] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<{ success: true; data: DoctorBooking[]; meta: PaginationMeta }>(API.BOOKINGS.DOCTOR_REQUESTS)
      .then(({ data }) => { if (!cancelled) setRequests(data.data as DoctorBooking[]); })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { return load(); }, [load]);

  const handleAccept = async (id: string): Promise<void> => {
    setActionId(id);
    try {
      await api.patch(API.BOOKINGS.DOCTOR_ACCEPT(id));
      toast.success('Booking accepted — it will now go to admin for confirmation.');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setActionId(null);
    }
  };

  const handleProposeTime = async (id: string): Promise<void> => {
    if (!proposedTime) { toast.error('Please select a time.'); return; }
    setActionId(id);
    try {
      const proposedStartAt = new Date(proposedTime).toISOString();
      await api.patch(API.BOOKINGS.DOCTOR_PROPOSE_TIME(id), { proposedStartAt });
      toast.success('New time proposed — waiting for customer to accept.');
      load();
      setProposeModal(null);
      setProposedTime('');
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <SidebarLayout
      title="Doctor Requests"
      description="Booking requests from patients who selected you as their doctor"
    >
      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-ink-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<UserSquare2 className="h-7 w-7" />}
            title="No pending requests"
            description="When a patient selects you as their doctor, requests will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4 animate-slide-up">
          {requests.map((r) => (
            <Card key={r.id} padding="md" variant="elevated">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-mono text-xs text-ink-500">{r.bookingNumber}</p>
                    <StatusBadge status={r.status} kind="booking" size="sm" />
                  </div>
                  <p className="font-semibold text-ink-900">{r.patient.fullName}</p>
                  {r.patient.primaryCondition ? (
                    <p className="text-xs text-ink-500 mt-0.5">Condition: {r.patient.primaryCondition}</p>
                  ) : null}
                  <p className="text-sm text-ink-700 mt-1">{r.package.name} · {r.city.name}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-ink-600">
                    <Calendar className="h-3.5 w-3.5 text-brand-600" />
                    <span>Requested: <strong>{formatDateTime(r.requestedStartAt)}</strong></span>
                  </div>
                  {r.status === 'TIME_PROPOSED' && r.proposedStartAt ? (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-orange-700">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Your proposed time: <strong>{formatDateTime(r.proposedStartAt)}</strong> — awaiting customer</span>
                    </div>
                  ) : null}
                  {r.specialInstructions ? (
                    <p className="text-xs text-ink-500 mt-1 italic">"{r.specialInstructions}"</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-xl font-bold text-brand-700">
                    {formatCurrency(r.totalPrice, r.currency)}
                  </p>
                  {r.status === 'PENDING_DOCTOR' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleAccept(r.id)}
                        disabled={actionId === r.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {actionId === r.id ? 'Saving…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => { setProposeModal(r.id); setProposedTime(''); }}
                        disabled={actionId === r.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ink-700 bg-white ring-1 ring-ink-200 hover:ring-ink-300 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Clock className="h-4 w-4" />
                        Propose time
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Propose time modal */}
      {proposeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm">
          <Card variant="elevated" padding="lg" className="max-w-sm w-full animate-scale-in">
            <h3 className="text-lg font-bold text-ink-900">Propose a new time</h3>
            <p className="text-sm text-ink-500 mt-1">
              The patient will be notified and can accept or decline.
            </p>
            <input
              type="datetime-local"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-4 w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setProposeModal(null)}
                className="px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleProposeTime(proposeModal)}
                disabled={!proposedTime || actionId === proposeModal}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {actionId === proposeModal ? 'Sending…' : 'Send proposal'}
              </button>
            </div>
          </Card>
        </div>
      ) : null}
    </SidebarLayout>
  );
}
