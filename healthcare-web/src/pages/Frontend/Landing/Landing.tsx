import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
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
  ChevronDown,
  Sparkles,
  Quote,
  HeartPulse,
  Award,
  Check,
  MapPin,
  Calendar,
  Lock,
  Headphones,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import { ServiceCardSkeleton } from '../../../component/common/Skeleton';
import { TopNav } from '../../../component/common/TopNav';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useLanding } from './useLanding';
import type { ServiceType } from '../../../types/booking.types';

// Service icon mapping with rich fallbacks
const SERVICE_ICON: Record<string, JSX.Element> = {
  NURSING: <Stethoscope className="h-6 w-6" />,
  CAREGIVER: <HandHeart className="h-6 w-6" />,
  LAB_SAMPLING: <TestTube2 className="h-6 w-6" />,
  VISITING_DOCTOR: <UserSquare2 className="h-6 w-6" />,
  PHYSIOTHERAPY: <Activity className="h-6 w-6" />,
  AMBULANCE: <Siren className="h-6 w-6" />,
};

// Clinical highlights for each service category
const SERVICE_FEATURES: Record<string, string[]> = {
  NURSING: [
    'PNC registered nurses & certified medical technicians',
    'Post-operative wound dressing, cannula & IV drip setup',
    'Full vitals monitoring (BP, Blood Glucose, SpO2, Pulse)',
  ],
  VISITING_DOCTOR: [
    'PMDC verified general physicians & medical officers',
    'In-home clinical examination & digital prescription',
    'Follow-up guidance & medication dosage review',
  ],
  LAB_SAMPLING: [
    'Sterile vacutainer phlebotomy at your bedside',
    'Partnership with ISO-certified pathology laboratories',
    'Digital PDF test report uploaded within 12–24 hours',
  ],
  PHYSIOTHERAPY: [
    'Licensed physiotherapists (DPT qualified)',
    'Post-stroke rehabilitation & stroke recovery exercises',
    'Mobility restoration, joint mobilization & pain management',
  ],
  CAREGIVER: [
    'Trained male & female patient attendants',
    'Assistance with bathing, grooming, feeding & mobility',
    'Bed-bound & dementia care with compassionate supervision',
  ],
  AMBULANCE: [
    'Rapid response dispatch across Faisalabad city',
    'Equipped with oxygen cylinders, stretcher & suction apparatus',
    'Trained paramedic onboard for hospital transfers',
  ],
};

const SERVICE_PRICING: Record<string, string> = {
  NURSING: 'From PKR 1,500 / visit',
  VISITING_DOCTOR: 'From PKR 2,500 / visit',
  LAB_SAMPLING: 'From PKR 500 + test fee',
  PHYSIOTHERAPY: 'From PKR 2,000 / session',
  CAREGIVER: 'From PKR 1,800 / shift',
  AMBULANCE: 'From PKR 3,500 / trip',
};

// 4-step streamlined care pathway
const STEPS = [
  {
    num: '01',
    title: 'Select Home Service & Slot',
    desc: 'Choose nursing, a doctor visit, lab sampling, or physiotherapy. Pick the date and time that suits your family.',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    num: '02',
    title: 'Instant Clinical Confirmation',
    desc: 'Our clinical coordinator confirms your booking within 15 minutes and matches a verified specialist near you.',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    num: '03',
    title: 'Doorstep Care with Sterile Kit',
    desc: 'A verified healthcare professional arrives at your home in uniform with sealed single-use equipment and official photo ID.',
    icon: <HeartPulse className="h-5 w-5" />,
  },
  {
    num: '04',
    title: 'Digital Reports & Follow-up',
    desc: 'Receive digital clinical notes, official lab results, and medication guidelines directly in your portal. Pay only after care.',
    icon: <FileText className="h-5 w-5" />,
  },
] as const;

// Testimonials from verified families across Faisalabad
const TESTIMONIALS = [
  {
    name: 'Hassan Akhtar',
    location: 'Peoples Colony No. 1, Faisalabad',
    service: 'Post-Surgical Nursing Care',
    quote:
      'My mother had major orthopedic surgery and required sterile wound dressing and IV medication twice daily. The registered nurse was always punctual, gentle, and followed strict hygiene. Having hospital-level care at home eliminated all hospital stress.',
    rating: 5,
    tag: 'Verified Patient Family',
  },
  {
    name: 'Dr. Aisha Rehman',
    location: 'Madina Town, Faisalabad',
    service: 'Visiting Physician & Lab Tests',
    quote:
      'As a doctor myself, I am very cautious about clinical protocols. When my father developed sudden high fever, HomeHealth sent an experienced physician and a phlebotomist within an hour. The diagnosis and CBC reports were prompt and completely accurate.',
    rating: 5,
    tag: 'Medical Professional Referral',
  },
  {
    name: 'Sara Mukhtar',
    location: 'Gulberg, Faisalabad',
    service: 'Elderly Care & Blood Sampling',
    quote:
      'Taking my 82-year-old grandfather to diagnostic centers for blood tests was an ordeal. HomeHealth’s phlebotomist was extraordinarily professional. Sealed needles, gentle prick, and results were sent to my WhatsApp the very same evening. Truly commendable service.',
    rating: 5,
    tag: 'Monthly Subscriber',
  },
  {
    name: 'Muhammad Usman',
    location: 'Kohinoor City, Faisalabad',
    service: 'Stroke Physiotherapy',
    quote:
      'After a mild stroke, my uncle needed regular motor rehabilitation. The physiotherapist from HomeHealth worked with him patiently for three weeks. His balance and hand grip have recovered significantly. Transparent fees and no hidden charges.',
    rating: 5,
    tag: 'Rehabilitation Care',
  },
] as const;

// Frequently Asked Questions
const FAQS = [
  {
    q: 'Are your doctors, nurses, and technicians verified by official councils?',
    a: 'Yes, 100%. All doctors are registered with PMDC (Pakistan Medical & Dental Council), all nurses are licensed by PNC (Pakistan Nursing Council), and diagnostic phlebotomists are certified medical laboratory technicians. Every provider undergoes a 4-tier verification including CNIC authentication, degree verification, practical skills evaluation, and police background clearance.',
  },
  {
    q: 'How fast can a healthcare provider reach my home in Faisalabad?',
    a: 'For urgent requests, our average arrival time across major areas of Faisalabad (Peoples Colony, Madina Town, Gulberg, Kohinoor, D Ground, Canal Road) is 45 to 60 minutes. You can also schedule visits in advance for specific morning or evening slots at your convenience.',
  },
  {
    q: 'How and when do I make the payment? Is advance payment required?',
    a: 'Zero advance payment is required for standard home visits. You only pay after the healthcare service has been successfully completed at your doorstep. We accept cash on delivery, JazzCash, EasyPaisa, and online bank transfers. An itemized digital receipt is immediately issued to your account.',
  },
  {
    q: 'Can I book ongoing daily or weekly care for an elderly or bedridden patient?',
    a: 'Yes, we offer flexible daily, weekly, and monthly packages for post-operative care, elderly patient companionship, stroke recovery, and chronic disease management. You can also request consistent caregiver or nursing staff for ongoing patient comfort.',
  },
  {
    q: 'How do I receive lab test results and doctor prescriptions?',
    a: 'All pathology results and digital prescriptions are securely uploaded to your HomeHealth patient portal, accessible on your phone or computer. You also receive an instant WhatsApp alert with a secure download link as soon as your reports are verified by the pathologist.',
  },
  {
    q: 'What safety and hygiene standards do your staff follow during home visits?',
    a: 'Our healthcare workers adhere to hospital-grade infection control protocols. All needles, vacutainers, cannulas, and bandages are single-use sealed sterile kits opened in front of you. Staff wear fresh surgical masks, sanitized gloves, and carry calibrated digital diagnostic instruments.',
  },
] as const;

export function Landing(): JSX.Element {
  const location = useLocation();
  const { services, isLoading, handleBookNow, handleWhatsApp } = useLanding();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.hash]);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  // Filtered services
  const displayedServices = services.filter((s) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'NURSING') return s.code === 'NURSING' || s.code === 'CAREGIVER';
    if (activeCategory === 'DOCTOR') return s.code === 'VISITING_DOCTOR';
    if (activeCategory === 'LAB') return s.code === 'LAB_SAMPLING';
    if (activeCategory === 'THERAPY') return s.code === 'PHYSIOTHERAPY';
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-ink-900 font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* ───── Urgent Care / Hotline Top Ribbon ───── */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white text-xs py-2 px-4 border-b border-brand-700/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 text-2xs font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live in Faisalabad
            </span>
            <span className="text-brand-100 hidden md:inline">
              Verified Doctors, Nurses & Lab Sampling delivered to your doorstep.
            </span>
          </div>

          <div className="flex items-center gap-4 text-brand-100">
            <a
              href="tel:+923001234567"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-medium"
            >
              <Phone className="h-3 w-3 text-brand-300" />
              <span>24/7 Helpline: +92 300 1234567</span>
            </a>
            <span className="text-brand-700 hidden sm:inline">|</span>
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1 text-emerald-300 hover:text-white transition-colors font-semibold"
            >
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───── Top Navigation ───── */}
      <TopNav variant="solid" />

      {/* ───── Modern Hero Section ───── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white pt-10 pb-20 lg:pt-16 lg:pb-28">
        {/* Soft clinical background ambient lights */}
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-brand-200/35 blur-3xl" />
        <div className="absolute top-1/3 left-0 -z-10 h-80 w-80 rounded-full bg-accent-200/25 blur-3xl" />
        <div className="absolute bottom-10 right-0 -z-10 h-72 w-72 rounded-full bg-brand-100/40 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Clinical Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 ring-1 ring-brand-300/60 text-brand-800 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span>Pakistan’s Trusted Home Healthcare Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.08]">
              Hospital-Grade Healthcare,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-brand-600 to-teal-600 block sm:inline">
                Right At Your Doorstep.
              </span>
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl font-normal">
              Licensed physicians, registered nurses, certified physiotherapists, and accredited diagnostic lab
              sampling delivered to your home in Faisalabad. Fast arrival, sealed sterile kits, and zero advance payment.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => handleBookNow()}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white shadow-brand-lg px-8 py-3.5 rounded-xl font-bold"
              >
                Book an Appointment
              </Button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100 active:bg-emerald-200 transition-all shadow-soft"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>WhatsApp Coordinator</span>
              </button>
            </div>

            {/* Key Trust Counters */}
            <div className="pt-8 border-t border-ink-100/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-brand-700 font-bold text-2xl lg:text-3xl">
                  <span>100%</span>
                  <BadgeCheck className="h-5 w-5 text-brand-600" />
                </div>
                <p className="text-xs text-ink-500 font-medium mt-0.5">PNC & PMDC Verified</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-brand-700 font-bold text-2xl lg:text-3xl">
                  <span>4.9</span>
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </div>
                <p className="text-xs text-ink-500 font-medium mt-0.5">2,500+ Happy Families</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-brand-700 font-bold text-2xl lg:text-3xl">
                  <span>&lt; 60m</span>
                  <Clock className="h-5 w-5 text-brand-600" />
                </div>
                <p className="text-xs text-ink-500 font-medium mt-0.5">Rapid Doorstep Arrival</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-brand-700 font-bold text-2xl lg:text-3xl">
                  <span>PKR 0</span>
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                </div>
                <p className="text-xs text-ink-500 font-medium mt-0.5">Zero Advance Payment</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Clinical Care Preview Interface */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl ring-1 ring-ink-100">
              {/* Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-ink-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600" />
                  </span>
                  <span className="text-xs font-bold text-ink-800 uppercase tracking-wider">
                    Care Desk Active · Faisalabad
                  </span>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                  Avg. ETA 45 min
                </span>
              </div>

              {/* Verified Specialist Showcase Card */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-brand-50/80 to-white ring-1 ring-brand-200/70">
                <div className="flex items-start gap-3.5">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center font-bold text-xl shadow-brand">
                      SA
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-ink-900 text-base truncate">Dr. Sara Ahmed, MBBS</h4>
                      <BadgeCheck className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    </div>
                    <p className="text-xs text-ink-600 mt-0.5">PMDC # 89432-P · Visiting Physician</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 4.95 (380+ visits)
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-medium">Verified On-Duty</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-brand-100 flex items-center justify-between text-xs text-ink-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope className="h-3.5 w-3.5 text-brand-600" />
                    <span>Sterile Medical Kit Included</span>
                  </span>
                  <span className="font-semibold text-brand-800">Arrival in ~45m</span>
                </div>
              </div>

              {/* Instant Service Selection Grid */}
              <div className="mt-5">
                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2.5">
                  Popular Home Services
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBookNow('NURSING')}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-100 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 group-hover:text-brand-800">Nursing Care</p>
                      <p className="text-2xs text-ink-500 truncate">Drip, wound dressing</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleBookNow('VISITING_DOCTOR')}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-100 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <UserSquare2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 group-hover:text-brand-800">Doctor Visit</p>
                      <p className="text-2xs text-ink-500 truncate">Checkup & prescription</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleBookNow('LAB_SAMPLING')}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-100 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <TestTube2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 group-hover:text-brand-800">Lab Sampling</p>
                      <p className="text-2xs text-ink-500 truncate">Bedside blood draw</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleBookNow('PHYSIOTHERAPY')}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-100 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-900 group-hover:text-brand-800">Physiotherapy</p>
                      <p className="text-2xs text-ink-500 truncate">Rehab & joint pain</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Guarantee Banner */}
              <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between text-2xs text-ink-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <span>CNIC & Police Verified Staff</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Lock className="h-3.5 w-3.5 text-brand-600" />
                  <span>Encrypted Health Records</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust & Accreditation Bar ───── */}
      <section id="trust" className="scroll-mt-20 border-y border-ink-100 bg-ink-50/50 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard
              icon={<Award className="h-6 w-6 text-brand-700" />}
              title="100% Verified Practitioners"
              desc="Every nurse is PNC licensed and every doctor is PMDC registered. Rigorous 4-step background check."
            />
            <TrustCard
              icon={<TestTube2 className="h-6 w-6 text-brand-700" />}
              title="Accredited Partner Labs"
              desc="All pathology samples analyzed in ISO-certified partner labs with online digital PDF reporting."
            />
            <TrustCard
              icon={<ShieldCheck className="h-6 w-6 text-brand-700" />}
              title="Sterile Hospital Protocols"
              desc="Sealed single-use kits, sterile gloves, and sanitized clinical equipment opened at your bedside."
            />
            <TrustCard
              icon={<CheckCircle2 className="h-6 w-6 text-brand-700" />}
              title="Transparent Flat Rates"
              desc="Upfront pricing with zero hidden travel charges. Pay cash or online only after service delivery."
            />
          </div>
        </div>
      </section>

      {/* ───── Comprehensive Services Grid ───── */}
      <section id="services" className="scroll-mt-20 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <Badge tone="brand" size="md">
                Clinical Services
              </Badge>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">
                Complete Healthcare Services at Home
              </h2>
              <p className="mt-3 text-base sm:text-lg text-ink-600 leading-relaxed">
                From a single routine injection to comprehensive post-hospital recovery, choose the certified care your
                loved ones need.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'All Services' },
                { id: 'NURSING', label: 'Nursing & Care' },
                { id: 'DOCTOR', label: 'Doctor Visit' },
                { id: 'LAB', label: 'Lab Sampling' },
                { id: 'THERAPY', label: 'Physiotherapy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                    activeCategory === tab.id
                      ? 'bg-brand-700 text-white shadow-brand'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200 hover:text-ink-900',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
            ) : displayedServices.length > 0 ? (
              displayedServices.map((service, idx) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={idx}
                  onBook={() => handleBookNow(service.code)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-ink-500">
                No services found for the selected category.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how" className="scroll-mt-20 py-20 lg:py-28 bg-gradient-to-b from-brand-50/50 via-white to-brand-50/30 border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <Badge tone="brand" size="md">
              Simple 4-Step Process
            </Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">
              How HomeHealth Works
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-600">
              Reliable, hospital-standard healthcare brought to your home in four simple steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {STEPS.map((step, idx) => (
              <div
                key={step.num}
                className="relative bg-white rounded-3xl p-7 shadow-card hover:shadow-card-hover border border-ink-100 transition-all group"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-3xl font-black text-brand-200 group-hover:text-brand-600 transition-colors">
                    {step.num}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                    {step.icon}
                  </div>
                </div>

                <h3 className="font-bold text-ink-900 text-lg">{step.title}</h3>
                <p className="text-sm text-ink-600 mt-2.5 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Why Choose Us (Clinical Safety Pillars) ───── */}
      <section id="why" className="scroll-mt-20 py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <Badge tone="brand" size="md">
              Clinical Quality & Safety
            </Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">
              Why Families Depend on HomeHealth
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-600">
              We uphold the highest clinical, legal, and privacy standards so you can rest assured your loved ones are
              in competent hands.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-brand-700" />}
              title="4-Tier Provider Vetting"
              desc="Every practitioner passes strict identity checks, active council registration audits (PNC / PMDC), practical bedside skill assessments, and police background checks."
            />
            <FeatureCard
              icon={<Headphones className="h-6 w-6 text-brand-700" />}
              title="Dedicated Care Coordinator"
              desc="A licensed medical coordinator oversees every assignment, handles doctor communications, and keeps families informed before, during, and after visits."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6 text-brand-700" />}
              title="Real-Time WhatsApp & SMS Alerts"
              desc="Stay updated with instant specialist confirmation, estimated arrival times, provider credentials, and digital invoice receipts."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-brand-700" />}
              title="Digital Medical Records"
              desc="Never lose a prescription or blood report again. Access permanent, secure digital health records from any smartphone or browser anytime."
            />
            <FeatureCard
              icon={<HeartPulse className="h-6 w-6 text-brand-700" />}
              title="Hospital-Grade Infection Control"
              desc="Strict safety protocols including fresh medical gloves, sealed disposable needles, sanitized diagnostic gear, and clinical waste disposal."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6 text-brand-700" />}
              title="Pay After Care Delivered"
              desc="Total peace of mind. No advance deposits or cancellation penalties for standard appointments. Inspect care first, pay conveniently after."
            />
          </div>
        </div>
      </section>

      {/* ───── Patient Testimonials ───── */}
      <section id="testimonials" className="scroll-mt-20 py-20 lg:py-28 bg-ink-50/60 border-t border-ink-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Badge tone="accent" size="md">
              Patient Stories
            </Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">
              Trusted by 2,500+ Families in Faisalabad
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-600">
              Read how our certified healthcare specialists have supported families across Faisalabad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className="relative bg-white rounded-3xl p-7 shadow-card hover:shadow-card-hover border border-ink-100/80 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                      {t.tag}
                    </span>
                  </div>

                  <Quote className="h-8 w-8 text-brand-200 mb-2" />
                  <p className="text-ink-700 text-sm sm:text-base leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-ink-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-ink-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-ink-500 mt-0.5">{t.location}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg">
                    {t.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Frequently Asked Questions (Accordion) ───── */}
      <section id="faq" className="scroll-mt-20 py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge tone="brand" size="md">
              Got Questions?
            </Badge>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-600">
              Everything you need to know about our home healthcare standards, booking, and fees.
            </p>
          </div>

          <div className="space-y-3.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={clsx(
                    'rounded-2xl border transition-all duration-200',
                    isOpen
                      ? 'border-brand-500 bg-brand-50/30 shadow-card'
                      : 'border-ink-200 bg-white hover:border-ink-300',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-ink-900 text-base sm:text-lg leading-snug">
                      {faq.q}
                    </span>
                    <div
                      className={clsx(
                        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200',
                        isOpen ? 'bg-brand-700 text-white rotate-180' : 'bg-ink-100 text-ink-600',
                      )}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm sm:text-base text-ink-600 leading-relaxed border-t border-brand-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center text-sm text-ink-600">
            Have a specific clinical question?{' '}
            <button
              onClick={handleWhatsApp}
              className="font-bold text-brand-700 hover:text-brand-800 underline underline-offset-4"
            >
              Ask our Medical Coordinator on WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* ───── High-Converting Emergency & Booking Banner ───── */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-teal-900 text-white px-8 py-14 sm:px-14 sm:py-16 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs font-semibold backdrop-blur-sm text-emerald-200">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Immediate Doorstep Dispatch Available</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Need a Doctor or Nurse at Home Today?
                </h2>
                <p className="text-brand-100 text-base sm:text-lg max-w-xl leading-relaxed">
                  Connect with our clinical desk in seconds. Rapid response, verified staff, and hospital-standard
                  care delivered right to your family.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button
                  size="lg"
                  onClick={handleWhatsApp}
                  leftIcon={<MessageCircle className="h-5 w-5" />}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg border-0"
                >
                  WhatsApp Care Desk
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleBookNow()}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  className="bg-white/10 hover:bg-white/20 text-white ring-1 ring-white/30 font-bold py-4 rounded-xl backdrop-blur-sm border-0"
                >
                  Book Online in 60s
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Comprehensive Footer ───── */}
      <footer className="bg-ink-950 text-ink-400 border-t border-ink-800">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="white" size="lg" subtitleText="PAKISTAN" />
            <p className="text-sm text-ink-400 max-w-sm leading-relaxed">
              HomeHealth is Pakistan’s trusted home healthcare service provider. Connecting families with PNC-licensed
              nurses, PMDC-registered physicians, and accredited diagnostic laboratories at home.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-ink-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-400" />
                PNC & PMDC Certified
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-brand-400" />
                HIPAA-Grade Privacy
              </span>
            </div>
          </div>

          {/* Quick Services */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleBookNow('NURSING')}
                  className="hover:text-white transition-colors"
                >
                  Home Nursing Care
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleBookNow('VISITING_DOCTOR')}
                  className="hover:text-white transition-colors"
                >
                  Visiting Doctor Checkup
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleBookNow('LAB_SAMPLING')}
                  className="hover:text-white transition-colors"
                >
                  Bedside Lab Sampling
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleBookNow('PHYSIOTHERAPY')}
                  className="hover:text-white transition-colors"
                >
                  Home Physiotherapy
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleBookNow('CAREGIVER')}
                  className="hover:text-white transition-colors"
                >
                  Elderly Caregiver Support
                </button>
              </li>
            </ul>
          </div>

          {/* Coverage Areas */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Coverage Areas</h4>
            <ul className="space-y-2 text-xs text-ink-400">
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                Peoples Colony (1 & 2)
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                Madina Town & Susan Rd
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                Gulberg & Jinnah Colony
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                Kohinoor & D Ground
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-400" />
                Canal Road & Eden Valley
              </li>
              <li className="text-2xs text-ink-500 pt-1">+ All major sectors of Faisalabad</li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact Desk</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="tel:+923001234567"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Phone className="h-4 w-4 text-brand-400" />
                  +92 300 1234567
                </a>
              </li>
              <li>
                <button
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-white transition-colors font-semibold"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Helpline
                </button>
              </li>
              <li className="text-xs text-ink-400 pt-1">
                <p className="font-semibold text-white">Operations Hours:</p>
                <p>24 Hours / 7 Days a Week</p>
                <p className="text-2xs text-ink-500 mt-1">Direct home dispatch across Faisalabad</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency Medical Notice & Copyright */}
        <div className="border-t border-ink-900 bg-ink-950/80">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
            <p className="text-2xs text-ink-500 leading-relaxed text-center sm:text-left">
              <strong className="text-ink-400">Emergency Notice:</strong> HomeHealth provides scheduled and urgent
              at-home healthcare and nursing support. In life-threatening medical emergencies (e.g. acute cardiac
              arrest, massive hemorrhage, severe trauma), please immediately dial Rescue 1122 or visit the nearest
              hospital emergency department.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500 pt-2 border-t border-ink-900">
              <p>&copy; {new Date().getFullYear()} HomeHealth Pakistan. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/auth/login" className="hover:text-white transition-colors">
                  Staff Login
                </Link>
                <span>·</span>
                <Link to="/auth/login" className="hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ───── Floating WhatsApp Concierge Button ───── */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white pl-3.5 pr-4 py-3 rounded-full shadow-2xl ring-4 ring-emerald-500/20 transition-all duration-300 hover:scale-105"
        aria-label="Chat with Care Desk on WhatsApp"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="text-xs font-bold hidden sm:inline">WhatsApp Care Desk</span>
      </button>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}): JSX.Element {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-ink-100 shadow-soft">
      <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-ink-900 text-sm">{title}</h3>
        <p className="text-xs text-ink-600 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: JSX.Element;
  title: string;
  desc: string;
}): JSX.Element {
  return (
    <div className="p-7 rounded-3xl bg-white border border-ink-100 shadow-card hover:shadow-card-hover transition-all">
      <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="font-bold text-ink-900 text-lg">{title}</h3>
      <p className="text-sm text-ink-600 mt-2 leading-relaxed">{desc}</p>
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
  const features = SERVICE_FEATURES[service.code] ?? [
    'Verified, background-checked professional',
    'Sterile clinical equipment included',
    'Digital visit report and follow-up support',
  ];
  const price = SERVICE_PRICING[service.code] ?? 'Flat Transparent Pricing';

  return (
    <article
      className="group relative bg-white rounded-3xl p-7 border border-ink-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-brand-600 group-hover:to-brand-800 group-hover:text-white transition-all shadow-sm">
            {icon}
          </div>
          <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-ink-100 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-800 transition-colors">
            {price}
          </span>
        </div>

        <h3 className="text-xl font-bold text-ink-900 group-hover:text-brand-800 transition-colors">
          {service.name}
        </h3>

        <p className="mt-2 text-sm text-ink-600 leading-relaxed min-h-[2.75rem]">
          {service.description ?? 'Professional, verified healthcare delivered safely to your home.'}
        </p>

        {/* Feature bullets */}
        <ul className="mt-5 space-y-2 border-t border-ink-100 pt-4">
          {features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-700">
              <Check className="h-3.5 w-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 pt-4 border-t border-ink-100">
        <Button
          fullWidth
          size="md"
          onClick={onBook}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="bg-brand-50 text-brand-800 hover:bg-brand-700 hover:text-white font-bold transition-all border border-brand-200 hover:border-brand-700"
        >
          Book This Service
        </Button>
      </div>
    </article>
  );
}
