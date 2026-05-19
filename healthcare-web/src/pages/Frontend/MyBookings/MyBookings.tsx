import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Heart, Plus, CalendarPlus, LogOut } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { BookingCard } from '../../../component/booking/BookingCard';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { clearAuth } from '../../../redux/slices/authSlice';
import { api } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useMyBookings, type MyBookingsTab } from './useMyBookings';

const TABS: { id: MyBookingsTab; label: string }[] = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export function MyBookings(): JSX.Element {
  const m = useMyBookings();
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await api.post(API.AUTH.LOGOUT).catch(() => null);
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
              <Heart className="h-4 w-4" fill="currentColor" />
            </div>
            <p className="font-bold text-ink-900">HomeHealth</p>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={m.handleNewBooking} leftIcon={<Plus className="h-4 w-4" />}>
              New booking
            </Button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 animate-slide-up">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">
            {user?.fullName ? `Hi, ${user.fullName.split(' ')[0]}` : 'My bookings'}
          </h1>
          <p className="text-ink-500 mt-1">Track your scheduled, ongoing, and past bookings.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl ring-1 ring-ink-100 p-1.5 inline-flex gap-1 shadow-card">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => m.setActiveTab(t.id)}
              className={clsx(
                'px-5 py-2 text-sm font-semibold rounded-xl transition-all',
                m.activeTab === t.id
                  ? 'bg-gradient-brand text-white shadow-brand'
                  : 'text-ink-600 hover:text-ink-900',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {m.error ? (
          <div className="mt-8 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
            {m.error}
          </div>
        ) : null}

        {m.isLoading ? (
          <LoadingSpinner size="lg" label="Loading your bookings…" className="py-20" />
        ) : m.bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarPlus className="h-7 w-7" />}
            title={
              m.activeTab === 'ACTIVE'
                ? 'No active bookings yet'
                : m.activeTab === 'COMPLETED'
                  ? 'No completed bookings'
                  : 'No cancelled bookings'
            }
            description="Book a nurse, doctor, or caregiver in under a minute."
            action={<Button onClick={m.handleNewBooking} leftIcon={<Plus className="h-4 w-4" />}>Book a service</Button>}
          />
        ) : (
          <>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {m.bookings.map((b) => (
                <BookingCard
                  key={b.id}
                  bookingNumber={b.bookingNumber}
                  status={b.status}
                  patientName={b.patient?.fullName ?? '—'}
                  serviceName={b.serviceType?.name ?? '—'}
                  packageName={b.package?.name ?? '—'}
                  scheduledAt={b.requestedStartAt}
                  addressArea="Saved address"
                  totalPrice={b.totalPrice}
                  currency={b.currency}
                  onClick={() => m.handleOpen(b.id)}
                  highlightUrgency={b.urgencyLevel === 'URGENT' || b.urgencyLevel === 'EMERGENCY'}
                />
              ))}
            </div>
            {m.meta ? <Pagination meta={m.meta} onPageChange={m.setPage} /> : null}
          </>
        )}
      </main>
    </div>
  );
}
