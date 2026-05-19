import { Link } from 'react-router-dom';
import {
  Heart,
  ShieldCheck,
  BadgeCheck,
  Star,
  Stethoscope,
  HandHeart,
  TestTube2,
  UserSquare2,
  Activity,
  Siren,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  ChevronRight,
  Sparkles,
  Quote,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { useLanding } from './useLanding';
import type { ServiceType } from '../../../types/booking.types';

const SERVICE_ICON: Record<string, JSX.Element> = {
  NURSING: <Stethoscope className="h-6 w-6" />,
  CAREGIVER: <HandHeart className="h-6 w-6" />,
  LAB_SAMPLING: <TestTube2 className="h-6 w-6" />,
  VISITING_DOCTOR: <UserSquare2 className="h-6 w-6" />,
  PHYSIOTHERAPY: <Activity className="h-6 w-6" />,
  AMBULANCE: <Siren className="h-6 w-6" />,
};

const STEPS = [
  { num: 1, title: 'Book in 60 seconds', desc: 'Choose a service, pick a slot, share patient details. That’s it.' },
  { num: 2, title: 'We confirm fast', desc: 'Our team reviews and confirms with WhatsApp updates at every step.' },
  { num: 3, title: 'Verified staff arrives', desc: 'A trained, ID-verified professional arrives at your doorstep.' },
  { num: 4, title: 'Reports & follow-up', desc: 'Digital reports, condition notes, and easy rebooking when you need.' },
] as const;

const TESTIMONIALS = [
  {
    name: 'Hassan A.',
    role: 'Son of patient · Gulberg',
    quote:
      'My mother needed daily nursing after surgery. The nurse was punctual, kind, and shared a full report after every visit. Worth every rupee.',
    rating: 5,
  },
  {
    name: 'Dr. Aisha R.',
    role: 'Family physician · Madina Town',
    quote:
      'I refer my elderly patients here for home care. Verified staff, transparent pricing, and the WhatsApp updates give families real peace of mind.',
    rating: 5,
  },
  {
    name: 'Sara M.',
    role: 'Caregiver to father · Peoples Colony',
    quote:
      'Lab sampling at home saved us multiple hospital trips. The collector was professional, and results were uploaded directly to the app.',
    rating: 5,
  },
] as const;

export function Landing(): JSX.Element {
  const { services, isLoading, handleBookNow, handleWhatsApp } = useLanding();

  return (
    <div className="min-h-screen bg-white">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-40 glass border-b border-ink-100/60">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
              <Heart className="h-4.5 w-4.5" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-ink-900">HomeHealth</p>
              <p className="text-2xs text-ink-500 -mt-0.5">Faisalabad</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-600">
            <a href="#services" className="hover:text-ink-900 transition-colors">Services</a>
            <a href="#how" className="hover:text-ink-900 transition-colors">How it works</a>
            <a href="#trust" className="hover:text-ink-900 transition-colors">Why us</a>
            <a href="#contact" className="hover:text-ink-900 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Button size="sm" onClick={() => handleBookNow()} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Book Now
            </Button>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-gradient-mesh opacity-25" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Trusted by 500+ families in Faisalabad
            </Badge>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Quality healthcare,
              <br />
              <span className="bg-gradient-to-r from-brand-200 via-white to-brand-100 bg-clip-text text-transparent">
                delivered to your home.
              </span>
            </h1>
            <p className="mt-6 text-lg text-brand-100 leading-relaxed max-w-xl">
              Verified nurses, doctors, caregivers, lab sampling, physiotherapy, and ambulance services — all in one
              place. Book in minutes, get cared for at home.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={() => handleBookNow()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-white text-brand-800 hover:bg-brand-50 shadow-2xl"
              >
                Book a service
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleWhatsApp}
                leftIcon={<MessageCircle className="h-4 w-4" />}
                className="bg-transparent text-white ring-white/30 hover:bg-white/10"
              >
                Talk on WhatsApp
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md">
              <HeroStat icon={<BadgeCheck className="h-4 w-4" />} value="100%" label="Verified staff" />
              <HeroStat icon={<Star className="h-4 w-4" fill="currentColor" />} value="4.8" label="Avg. rating" />
              <HeroStat icon={<Clock className="h-4 w-4" />} value="< 2 hrs" label="Confirmation" />
            </div>
          </div>

          {/* Decorative floating cards */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl" />
            <div className="relative space-y-4">
              <FloatingCard
                badge="HHS-FSD-000234"
                title="Booking Confirmed"
                subtitle="Sarah Khan, RN · Visit in 60 min"
                tone="success"
                icon={<CheckCircle2 className="h-5 w-5" />}
                rotation="rotate-2"
              />
              <FloatingCard
                badge="LIVE"
                title="Nurse is en route"
                subtitle="ETA 12 minutes · Tracking live"
                tone="info"
                icon={<Activity className="h-5 w-5" />}
                rotation="-rotate-1 translate-x-8"
              />
              <FloatingCard
                badge="Report ready"
                title="Lab results uploaded"
                subtitle="Patient: Mr. Iqbal · Tap to view"
                tone="brand"
                icon={<TestTube2 className="h-5 w-5" />}
                rotation="rotate-1 -translate-x-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust strip ───── */}
      <section id="trust" className="border-y border-ink-100 bg-ink-50/40">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <TrustItem
            icon={<BadgeCheck className="h-6 w-6" />}
            title="100% Verified Staff"
            description="CNIC, qualifications, and background checked before assignment."
          />
          <TrustItem
            icon={<ShieldCheck className="h-6 w-6" />}
            title="HIPAA-grade Privacy"
            description="Encrypted records. Reports visible only to you and the assigned staff."
          />
          <TrustItem
            icon={<Star className="h-6 w-6" fill="currentColor" />}
            title="Transparent Pricing"
            description="Flat package rates. No hidden charges. Pay only after care delivered."
          />
        </div>
      </section>

      {/* ───── Services grid ───── */}
      <section id="services" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12 animate-slide-up">
            <Badge tone="brand">Our Services</Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              Comprehensive home care, one tap away
            </h2>
            <p className="mt-3 text-lg text-ink-600">
              From a single nursing visit to ongoing monthly care — pick what fits your needs.
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner size="lg" label="Loading services…" className="py-20" />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service, idx) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={idx}
                  onBook={() => handleBookNow(service.code)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how" className="py-20 lg:py-24 bg-gradient-brand-soft">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14 animate-slide-up">
            <Badge tone="brand">How it works</Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              From booking to recovery, in 4 simple steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div
                key={step.num}
                className="relative bg-white rounded-2xl p-6 shadow-card ring-1 ring-brand-200/40 animate-slide-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="absolute -top-3 -left-3 h-10 w-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-bold shadow-brand">
                  {step.num}
                </div>
                <h3 className="font-semibold text-ink-900 mt-4">{step.title}</h3>
                <p className="text-sm text-ink-600 mt-2 leading-relaxed">{step.desc}</p>
                {idx < STEPS.length - 1 ? (
                  <ChevronRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-300" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-12 animate-slide-up">
            <Badge tone="accent">What families say</Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
              Trusted by hundreds across Faisalabad
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <article
                key={t.name}
                className="relative bg-white rounded-2xl p-6 ring-1 ring-ink-100 shadow-card hover:shadow-card-hover transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <Quote className="absolute top-5 right-5 h-8 w-8 text-brand-100" fill="currentColor" />
                <div className="flex items-center gap-1 text-warning-500 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill="currentColor" />
                  ))}
                </div>
                <p className="text-ink-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-ink-100">
                  <div className="h-10 w-10 rounded-full bg-gradient-brand text-white flex items-center justify-center font-semibold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900 text-sm">{t.name}</p>
                    <p className="text-xs text-ink-500">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Big CTA ───── */}
      <section id="contact" className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-white px-8 py-14 sm:px-16 sm:py-20 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-mesh opacity-20" />
            <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1fr,auto] gap-8 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                  Need care today? We&rsquo;re here.
                </h2>
                <p className="mt-3 text-brand-100 text-lg max-w-xl">
                  Talk to our care coordinator on WhatsApp or book directly. Confirmation in under 2 hours.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button
                  size="lg"
                  onClick={handleWhatsApp}
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                  className="bg-success-500 text-white hover:bg-success-700 shadow-xl"
                >
                  WhatsApp us
                </Button>
                <Button
                  size="lg"
                  onClick={() => handleBookNow()}
                  className="bg-white text-brand-800 hover:bg-brand-50 shadow-xl"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Book online
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-ink-950 text-ink-400">
        <div className="max-w-7xl mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                <Heart className="h-4.5 w-4.5" fill="currentColor" />
              </div>
              <div className="leading-tight">
                <p className="font-bold text-white">HomeHealth</p>
                <p className="text-2xs text-ink-500">Faisalabad</p>
              </div>
            </Link>
            <p className="text-sm mt-4 leading-relaxed">
              Quality healthcare at your doorstep. Verified, trusted, transparent.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#services" className="hover:text-white transition-colors">Nursing</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Visiting Doctor</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Physiotherapy</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Lab Sampling</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#trust" className="hover:text-white transition-colors">Why us</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">How it works</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="inline-flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                +92 300 1234567
              </li>
              <li>
                <button onClick={handleWhatsApp} className="inline-flex items-center gap-2 hover:text-white">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp support
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-800">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
            <p>&copy; {new Date().getFullYear()} HomeHealth. All rights reserved.</p>
            <p>Made with care in Faisalabad, Pakistan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Subcomponents (UI only — keep close to page for cohesion) ──────────────

function HeroStat({ icon, value, label }: { icon: JSX.Element; value: string; label: string }): JSX.Element {
  return (
    <div>
      <div className="text-brand-300 mb-1.5">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-2xs text-brand-200 mt-0.5">{label}</p>
    </div>
  );
}

function FloatingCard({
  badge,
  title,
  subtitle,
  tone,
  icon,
  rotation,
}: {
  badge: string;
  title: string;
  subtitle: string;
  tone: 'success' | 'info' | 'brand';
  icon: JSX.Element;
  rotation: string;
}): JSX.Element {
  const toneBg: Record<typeof tone, string> = {
    success: 'bg-success-500',
    info: 'bg-sky-500',
    brand: 'bg-brand-500',
  };
  return (
    <div
      className={`relative p-5 rounded-2xl glass ring-1 ring-white/20 shadow-2xl ${rotation} animate-fade-in`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl ${toneBg[tone]} text-white flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xs font-mono uppercase tracking-wider text-white/70">{badge}</p>
          <p className="text-white font-semibold leading-tight truncate">{title}</p>
          <p className="text-brand-100 text-xs truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: JSX.Element;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-xl bg-white shadow-card text-brand-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <p className="text-sm text-ink-600 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  index,
  onBook,
}: {
  service: ServiceType;
  index: number;
  onBook: () => void;
}): JSX.Element {
  const icon = SERVICE_ICON[service.code] ?? <Stethoscope className="h-6 w-6" />;
  return (
    <article
      className="group relative bg-white rounded-2xl p-6 ring-1 ring-ink-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={onBook}
    >
      <div className="h-12 w-12 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center group-hover:bg-gradient-brand group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink-900">{service.name}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed line-clamp-3 min-h-[3.75rem]">
        {service.description ?? 'Professional, verified care delivered at home.'}
      </p>
      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:gap-2.5 transition-all">
        Book this service
        <ArrowRight className="h-4 w-4" />
      </div>
    </article>
  );
}
