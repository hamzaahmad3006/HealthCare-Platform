import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, CalendarDays, BookOpen,
  HeartPulse, User, AlertCircle, Activity,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';

interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  primaryCondition: string | null;
  allergies: string | null;
}

interface BookingSummary {
  id: string;
  bookingNumber: string;
  status: string;
  totalPrice: number;
  currency: string;
  requestedStartAt: string;
  createdAt: string;
  serviceType: { name: string };
  package: { name: string } | null;
}

interface CustomerDetail {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
  createdAt: string;
  patients: Patient[];
  bookings: BookingSummary[];
  _count: { bookings: number; patients: number };
}

const BOOKING_STATUS_CLS: Record<string, string> = {
  PENDING:    'bg-warning-50 text-warning-700',
  CONFIRMED:  'bg-brand-50 text-brand-700',
  COMPLETED:  'bg-success-50 text-success-700',
  CANCELLED:  'bg-danger-50 text-danger-700',
  IN_PROGRESS:'bg-brand-50 text-brand-700',
};

function ageFromDob(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} yrs`;
}

export function CustomerDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .get<{ data: CustomerDetail }>(API.ADMIN.CUSTOMER_BY_ID(id))
      .then(({ data }) => setCustomer(data.data))
      .catch((e) => setError(extractApiError(e).message))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <SidebarLayout title="Customer Detail">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-ink-100 animate-pulse" />)}
        </div>
      </SidebarLayout>
    );
  }

  if (error || !customer) {
    return (
      <SidebarLayout title="Customer Detail">
        <div className="px-4 py-3 rounded-xl bg-danger-50 text-danger-700 text-sm">{error ?? 'Customer not found'}</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      title={customer.fullName}
      description="Customer profile"
      actions={
        <button
          onClick={() => navigate('/admin/customers')}
          className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-ink-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      }
    >
      <div className="space-y-6 animate-slide-up">
        {/* Profile card */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
              {customer.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-ink-900">{customer.fullName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${customer.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                  {customer.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-600">
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-ink-400" /> {customer.phone}</span>
                {customer.email ? <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-ink-400" /> {customer.email}</span> : null}
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-ink-400" /> Joined {formatDateTime(customer.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-4 text-center flex-shrink-0">
              <div>
                <p className="text-2xl font-bold text-ink-900">{customer._count.bookings}</p>
                <p className="text-xs text-ink-500">Bookings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900">{customer._count.patients}</p>
                <p className="text-xs text-ink-500">Patients</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-ink-900">Patients ({customer.patients.length})</h3>
            </div>
            {customer.patients.length === 0 ? (
              <p className="text-sm text-ink-400">No patients added.</p>
            ) : (
              <div className="space-y-3">
                {customer.patients.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-ink-50 border border-ink-100">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-ink-400" />
                      <p className="text-sm font-semibold text-ink-900">{p.fullName}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-ink-500">
                      <span>{ageFromDob(p.dateOfBirth)} · {p.gender ?? 'Unknown'}</span>
                      {p.primaryCondition ? (
                        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {p.primaryCondition}</span>
                      ) : null}
                      {p.allergies ? (
                        <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {p.allergies}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Bookings */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-brand-500" />
              <h3 className="font-semibold text-ink-900">Recent Bookings</h3>
            </div>
            {customer.bookings.length === 0 ? (
              <p className="text-sm text-ink-400">No bookings yet.</p>
            ) : (
              <div className="space-y-2">
                {customer.bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/bookings/${b.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-ink-700">{b.bookingNumber}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-2xs font-bold ${BOOKING_STATUS_CLS[b.status] ?? 'bg-ink-100 text-ink-500'}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">{b.serviceType.name} · {formatDateTime(b.requestedStartAt)}</p>
                    </div>
                    <span className="text-sm font-bold text-ink-900 whitespace-nowrap">{b.currency} {Number(b.totalPrice).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
