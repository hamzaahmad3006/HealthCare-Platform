import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Plus,
  CalendarPlus,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  HandHeart,
  Activity,
  ShieldCheck,
  Clock,
  Sparkles,
  Users,
  FileText,
  MapPin,
  PhoneCall,
  ArrowRight,
  Search,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { BookingCard } from '../../../component/booking/BookingCard';
import { BookingCardSkeleton } from '../../../component/common/Skeleton';
import { Pagination } from '../../../component/common/Pagination';
import { TopNav } from '../../../component/common/TopNav';
import { useAppSelector } from '../../../redux/store';
import { useMyBookings, type MyBookingsTab } from './useMyBookings';

const TABS: { id: MyBookingsTab; label: string }[] = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

interface ServiceVisual {
  icon: JSX.Element;
  gradient: string;
  iconBg: string;
  tag: string;
  fallbackDesc: string;
}

function getServiceVisual(code: string): ServiceVisual {
  const c = code.toUpperCase();
  if (c.includes('DOCTOR')) {
    return {
      icon: <Stethoscope className="h-5 w-5" />,
      gradient: 'from-sky-50 to-blue-50/40 border-sky-200/70 hover:border-sky-300',
      iconBg: 'bg-sky-600 text-white shadow-sky-600/20',
      tag: 'PMDC Verified',
      fallbackDesc: 'Licensed physician consultation right at your home.',
    };
  }
  if (c.includes('LAB')) {
    return {
      icon: <FlaskConical className="h-5 w-5" />,
      gradient: 'from-violet-50 to-purple-50/40 border-violet-200/70 hover:border-violet-300',
      iconBg: 'bg-violet-600 text-white shadow-violet-600/20',
      tag: 'Digital Reports',
      fallbackDesc: 'Sterile home sample collection with fast digital reports.',
    };
  }
  if (c.includes('CAREGIVER') || c.includes('ATTENDANT')) {
    return {
      icon: <HandHeart className="h-5 w-5" />,
      gradient: 'from-amber-50 to-orange-50/40 border-amber-200/70 hover:border-amber-300',
      iconBg: 'bg-amber-600 text-white shadow-amber-600/20',
      tag: 'Daily Support',
      fallbackDesc: 'Compassionate elderly & post-hospitalization care.',
    };
  }
  if (c.includes('PHYSIO')) {
    return {
      icon: <Activity className="h-5 w-5" />,
      gradient: 'from-rose-50 to-pink-50/40 border-rose-200/70 hover:border-rose-300',
      iconBg: 'bg-rose-600 text-white shadow-rose-600/20',
      tag: 'Rehab & Mobility',
      fallbackDesc: 'Personalized physiotherapy & recovery sessions at home.',
    };
  }
  return {
    icon: <HeartPulse className="h-5 w-5" />,
    gradient: 'from-emerald-50 to-teal-50/40 border-emerald-200/70 hover:border-emerald-300',
    iconBg: 'bg-brand-600 text-white shadow-brand-600/20',
    tag: 'PNC Registered',
    fallbackDesc: 'Skilled nursing care, IV drips, injections & wound dressing.',
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function MyBookings(): JSX.Element {
  const m = useMyBookings();
  const user = useAppSelector((s) => s.auth.user);
  const [searchQuery, setSearchQuery] = useState('');

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return m.bookings;
    const q = searchQuery.toLowerCase().trim();
    return m.bookings.filter((b) => {
      const num = b.bookingNumber?.toLowerCase() ?? '';
      const pat = b.patient?.fullName?.toLowerCase() ?? '';
      const svc = b.serviceType?.name?.toLowerCase() ?? '';
      const pkg = b.package?.name?.toLowerCase() ?? '';
      return num.includes(q) || pat.includes(q) || svc.includes(q) || pkg.includes(q);
    });
  }, [m.bookings, searchQuery]);

  const activeCount = m.activeTab === 'ACTIVE' ? (m.meta?.total ?? m.bookings.length) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 via-white to-ink-50">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-8">
        {/* ── Hero Concierge Banner ──────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-teal-700 text-white p-6 sm:p-8 shadow-xl shadow-brand-900/10 animate-slide-up">
          {/* Decorative glow circles */}
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-emerald-50 mb-4">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                24/7 Verified Home Healthcare · Zero Advance Payment
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                Book PMDC &amp; PNC verified doctors, nurses, caregivers, or lab sampling right at your doorstep in under a minute.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={m.handleNewBooking}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-800 font-bold text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  Book a Home Visit
                </button>
                <Link
                  to="/my-patients"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
                >
                  <Users className="h-4 w-4" />
                  Family Patients
                </Link>
              </div>
            </div>

            {/* Live Glassmorphic Overview Metrics */}
            <div className="grid grid-cols-3 gap-3 lg:w-[340px] flex-shrink-0">
              <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 p-3.5 text-center">
                <p className="text-2xl font-black text-white">
                  {m.activeTab === 'ACTIVE' ? (m.meta?.total ?? m.bookings.length) : m.stats.completedCount}
                </p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">
                  {m.activeTab === 'ACTIVE' ? 'Active Visits' : 'Completed'}
                </p>
              </div>
              <Link
                to="/my-patients"
                className="rounded-2xl bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 p-3.5 text-center transition-colors"
              >
                <p className="text-2xl font-black text-white">{m.stats.patientsCount}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Patients</p>
              </Link>
              <Link
                to="/my-reports"
                className="rounded-2xl bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/15 p-3.5 text-center transition-colors"
              >
                <p className="text-2xl font-black text-white">{m.stats.reportsCount}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Reports</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Quick-Book Care Services Shelf ─────────────────────────── */}
        {m.services.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quick Care Dispatch
                </div>
                <h2 className="text-xl font-bold text-ink-900 mt-0.5">Need care at home today?</h2>
              </div>
              <button
                type="button"
                onClick={m.handleNewBooking}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                Explore all services
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {m.services.slice(0, 4).map((svc) => {
                const vis = getServiceVisual(svc.code);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => m.handleBookService(svc.code)}
                    className={clsx(
                      'group text-left rounded-2xl bg-gradient-to-br border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between gap-3',
                      vis.gradient,
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center shadow-md', vis.iconBg)}>
                          {vis.icon}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/85 text-ink-700 border border-ink-200/60">
                          {vis.tag}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
                        {svc.name}
                      </h3>
                      <p className="text-xs text-ink-600 mt-1 line-clamp-2 leading-relaxed">
                        {svc.description || vis.fallbackDesc}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs font-bold text-brand-700">
                      <span>Book now</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── My Bookings Section ────────────────────────────────────── */}
        <section className="rounded-3xl bg-white border border-ink-100 shadow-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Your Bookings</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Track live visit status, assigned clinicians, and care history.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search box */}
              <div className="relative flex-1 sm:flex-initial sm:w-56">
                <Search className="h-3.5 w-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search booking, patient..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-ink-50 border border-ink-200/80 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={m.retry}
                className="p-2 rounded-xl bg-ink-50 border border-ink-200/80 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                title="Refresh bookings"
                aria-label="Refresh bookings"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Segmented Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-ink-100">
            <div className="bg-ink-50 rounded-2xl p-1 inline-flex gap-1 border border-ink-100">
              {TABS.map((t) => {
                const isSelected = m.activeTab === t.id;
                const badgeCount =
                  t.id === 'ACTIVE' && activeCount !== undefined
                    ? activeCount
                    : t.id === 'COMPLETED' && m.stats.completedCount > 0
                      ? m.stats.completedCount
                      : null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => m.setActiveTab(t.id)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all',
                      isSelected
                        ? 'bg-gradient-brand text-white shadow-brand'
                        : 'text-ink-600 hover:text-ink-900',
                    )}
                  >
                    <span>{t.label}</span>
                    {badgeCount !== null && badgeCount > 0 ? (
                      <span
                        className={clsx(
                          'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                          isSelected ? 'bg-white/25 text-white' : 'bg-ink-200/80 text-ink-700',
                        )}
                      >
                        {badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {m.error ? (
            <div
              role="alert"
              className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 flex items-center justify-between gap-3"
            >
              <span>{m.error}</span>
              <Button size="sm" variant="secondary" onClick={m.retry}>
                Retry
              </Button>
            </div>
          ) : null}

          {/* Bookings Content */}
          {m.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <BookingCardSkeleton key={i} />
              ))}
            </div>
          ) : m.error ? null : filteredBookings.length === 0 ? (
            <div className="rounded-2xl bg-gradient-to-b from-brand-50/50 to-white border border-dashed border-brand-200 px-6 py-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-sm mb-4">
                <CalendarPlus className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-ink-900">
                {searchQuery.trim()
                  ? 'No matching bookings found'
                  : m.activeTab === 'ACTIVE'
                    ? 'No active bookings right now'
                    : m.activeTab === 'COMPLETED'
                      ? 'No completed visits yet'
                      : 'No cancelled bookings'}
              </h3>
              <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
                {searchQuery.trim()
                  ? 'Try clearing your search term or switching booking tabs.'
                  : 'Schedule a verified nurse, doctor, or caregiver to your doorstep in under 60 seconds.'}
              </p>

              {!searchQuery.trim() && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-200/80 shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                    PMDC / PNC Verified Staff
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-200/80 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Pay Cash / JazzCash After Visit
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-ink-200/80 shadow-2xs">
                    <Clock className="h-3.5 w-3.5 text-sky-600" />
                    Same-Day Dispatch
                  </span>
                </div>
              )}

              <div className="mt-6">
                {searchQuery.trim() ? (
                  <Button variant="secondary" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Button onClick={m.handleNewBooking} leftIcon={<Plus className="h-4 w-4" />}>
                    Book Your First Visit
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    bookingNumber={b.bookingNumber}
                    status={b.status}
                    patientName={b.patient?.fullName ?? '—'}
                    serviceName={b.serviceType?.name ?? '—'}
                    packageName={b.package?.name ?? '—'}
                    scheduledAt={b.requestedStartAt}
                    addressArea={
                      b.address?.area
                        ? `${b.address.area}${b.address.city?.name ? `, ${b.address.city.name}` : ''}`
                        : 'Saved address'
                    }
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
        </section>

        {/* ── Care Concierge Shortcuts & 24/7 Helpline ───────────────── */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-4">
          <Link
            to="/my-patients"
            className="group rounded-2xl bg-white border border-ink-100 p-4 shadow-2xs hover:shadow-md hover:border-brand-200 transition-all flex items-center gap-3.5"
          >
            <div className="h-11 w-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900">Family Patients</p>
              <p className="text-xs text-ink-500 truncate">Manage profiles &amp; health notes</p>
            </div>
          </Link>

          <Link
            to="/my-reports"
            className="group rounded-2xl bg-white border border-ink-100 p-4 shadow-2xs hover:shadow-md hover:border-sky-200 transition-all flex items-center gap-3.5"
          >
            <div className="h-11 w-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900">Medical Reports</p>
              <p className="text-xs text-ink-500 truncate">Lab results &amp; visit notes</p>
            </div>
          </Link>

          <Link
            to="/account"
            className="group rounded-2xl bg-white border border-ink-100 p-4 shadow-2xs hover:shadow-md hover:border-violet-200 transition-all flex items-center gap-3.5"
          >
            <div className="h-11 w-11 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-900">Saved Addresses</p>
              <p className="text-xs text-ink-500 truncate">Manage home map pins</p>
            </div>
          </Link>

          <a
            href="tel:+923001234567"
            className="group rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200/70 p-4 shadow-2xs hover:shadow-md transition-all flex items-center gap-3.5"
          >
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-950">24/7 Care Desk</p>
              <p className="text-xs font-mono font-semibold text-emerald-700 truncate">+92 300 1234567</p>
            </div>
          </a>
        </section>
      </main>
    </div>
  );
}
