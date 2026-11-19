import { useState } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Stethoscope,
  HandHeart,
  TestTube2,
  UserSquare2,
  Activity,
  Siren,
  Calendar,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  BadgeCheck,
  Star,
  Sparkles,
  Phone,
  HelpCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { TopNav } from '../../../component/common/TopNav';
import { PatientFormModal } from '../../../component/booking/PatientFormModal';
import { AddressFormModal } from '../../../component/booking/AddressFormModal';
import { formatCurrency, formatDate } from '../../../helper/format';
import { api } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useBookingForm, type StepNumber } from './useBookingForm';
import type { Patient, Address } from '../../../types/booking.types';

const SERVICE_ICON: Record<string, JSX.Element> = {
  NURSING: <Stethoscope className="h-6 w-6" />,
  CAREGIVER: <HandHeart className="h-6 w-6" />,
  LAB_SAMPLING: <TestTube2 className="h-6 w-6" />,
  VISITING_DOCTOR: <UserSquare2 className="h-6 w-6" />,
  PHYSIOTHERAPY: <Activity className="h-6 w-6" />,
  AMBULANCE: <Siren className="h-6 w-6" />,
};

const STEP_TITLES: Record<StepNumber, string> = {
  1: 'Service & Package',
  2: 'Patient & Address',
  3: 'Date & Preferences',
  4: 'Review & Confirm',
};

const STEP_SUBTITLES: Record<StepNumber, string> = {
  1: 'Select the home medical service and care package that fits your needs.',
  2: 'Tell us who will be receiving care and where our staff should arrive.',
  3: 'Pick your preferred date, arrival time slot, and clinical urgency level.',
  4: 'Verify your appointment details and confirm with zero advance payment.',
};

export function BookingForm(): JSX.Element {
  const f = useBookingForm();

  return (
    <div className="min-h-screen bg-ink-50/60 font-sans selection:bg-brand-100 selection:text-brand-900">
      <TopNav variant="solid" />

      {/* Header Banner */}
      <div className="bg-gradient-to-b from-brand-950 via-brand-900 to-teal-950 text-white py-10 px-6 relative overflow-hidden">
        {/* Soft background ambient lights */}
        <div className="absolute top-0 right-1/4 -mt-12 w-80 h-80 rounded-full bg-brand-500/20 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 left-10 -mb-12 w-64 h-64 rounded-full bg-teal-400/15 blur-2xl pointer-events-none animate-float-reverse" />

        <div className="max-w-6xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-xs font-semibold text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Doorstep Healthcare · Faisalabad Central &amp; Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Book Home Healthcare Visit
            </h1>
            <p className="text-xs sm:text-sm text-brand-100/90 max-w-xl leading-relaxed">
              PNC-licensed nurses, PMDC visiting doctors, and diagnostic blood sampling delivered safely to your home.
            </p>
          </div>

          {/* Quick reassurance badge */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-2xs sm:text-xs text-brand-100">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Zero Advance Payment</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/15">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span>100% Verified Staff</span>
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Stepper Navigation */}
        <div className="mb-8 p-4 sm:p-6 bg-white rounded-3xl shadow-card ring-1 ring-ink-100">
          <Stepper currentStep={f.currentStep} onStepClick={f.goToStep} />
        </div>

        {/* 2-Column Split: Active Step Form (Left) + Dynamic Sticky Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Step Interactive Form */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card ring-1 ring-ink-100/80 animate-fade-in-up">
              {f.isLoadingInitial ? (
                <LoadingSpinner size="lg" label="Preparing your booking options…" className="py-20" />
              ) : (
                <>
                  <div className="mb-6 pb-5 border-b border-ink-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md">
                        Step {f.currentStep} of 4
                      </span>
                      <span className="text-2xs text-ink-400 font-medium hidden sm:inline">
                        All services backed by sterile medical kits
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink-900 mt-2 tracking-tight">
                      {STEP_TITLES[f.currentStep]}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-500 mt-1 leading-relaxed">
                      {STEP_SUBTITLES[f.currentStep]}
                    </p>
                  </div>

                  {/* Render Current Step Component */}
                  {f.currentStep === 1 ? <Step1 form={f} /> : null}
                  {f.currentStep === 2 ? <Step2 form={f} /> : null}
                  {f.currentStep === 3 ? <Step3 form={f} /> : null}
                  {f.currentStep === 4 ? <Step4 form={f} /> : null}

                  {f.stepError ? (
                    <div className="mt-6 px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-xs text-danger-700 animate-slide-down flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger-600 flex-shrink-0 mt-0.5" />
                      <span>{f.stepError}</span>
                    </div>
                  ) : null}

                  {/* Nav buttons */}
                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-ink-100">
                    <Button
                      variant="outline"
                      onClick={f.goBack}
                      disabled={f.currentStep === 1 || f.isSubmitting}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                      className="rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-ink-100 transition-colors"
                    >
                      Back
                    </Button>

                    {f.currentStep < 4 ? (
                      <Button
                        onClick={f.goNext}
                        disabled={!f.canProceed}
                        rightIcon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                        className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold px-7 py-2.5 rounded-xl shadow-brand transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Continue to Next Step
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={() => void f.submit()}
                        isLoading={f.isSubmitting}
                        rightIcon={<CheckCircle2 className="h-5 w-5" />}
                        className="bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white font-extrabold px-8 py-3 rounded-xl shadow-brand-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Confirm Home Visit (PKR 0 Advance)
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Live Dynamic Care Summary Card (Sticky) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-card ring-1 ring-ink-100 overflow-hidden relative">
              <div className="flex items-center justify-between pb-4 border-b border-ink-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                    Care Order Summary
                  </h3>
                </div>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                  Step {f.currentStep}/4
                </span>
              </div>

              {/* Dynamic Items */}
              <div className="py-4 space-y-3.5 text-xs text-ink-700">
                {/* Service */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-400 font-medium">Service:</span>
                  <span className="font-bold text-ink-900 text-right">
                    {f.selectedService?.name ?? (
                      <span className="text-ink-400 font-normal italic">Not selected yet</span>
                    )}
                  </span>
                </div>

                {/* Package */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-400 font-medium">Package:</span>
                  <span className="font-semibold text-ink-800 text-right">
                    {f.selectedPackage ? (
                      <>
                        {f.selectedPackage.name}{' '}
                        <span className="text-2xs text-ink-400 font-normal">
                          ({f.selectedPackage.visitCount} visits)
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-400 font-normal italic">—</span>
                    )}
                  </span>
                </div>

                {/* Patient */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-400 font-medium">Patient:</span>
                  <span className="font-semibold text-ink-800 text-right truncate">
                    {f.selectedPatient?.fullName ?? (
                      <span className="text-ink-400 font-normal italic">—</span>
                    )}
                  </span>
                </div>

                {/* Address */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-400 font-medium">Location:</span>
                  <span className="font-semibold text-ink-800 text-right truncate">
                    {f.selectedAddress ? (
                      `${f.selectedAddress.area}, ${f.selectedAddress.line1}`
                    ) : (
                      <span className="text-ink-400 font-normal italic">—</span>
                    )}
                  </span>
                </div>

                {/* Date / Time */}
                {f.requestedDate ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-ink-400 font-medium">Scheduled:</span>
                    <span className="font-semibold text-ink-800 text-right">
                      {formatDate(f.requestedDate, 'dd MMM yyyy')} {f.requestedTime ? `· ${f.requestedTime}` : ''}
                    </span>
                  </div>
                ) : null}

                {/* Urgency */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink-400 font-medium">Urgency:</span>
                  <span
                    className={clsx(
                      'text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full',
                      f.urgencyLevel === 'EMERGENCY' && 'bg-danger-100 text-danger-700',
                      f.urgencyLevel === 'URGENT' && 'bg-warning-100 text-warning-800',
                      f.urgencyLevel === 'NORMAL' && 'bg-brand-50 text-brand-700',
                    )}
                  >
                    {f.urgencyLevel}
                  </span>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="mt-2 pt-4 border-t border-ink-100 bg-gradient-brand-soft -mx-6 -mb-6 p-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-700">Total Payable</span>
                  <span className="text-2xl font-extrabold text-brand-900">
                    {f.selectedPackage
                      ? formatCurrency(f.selectedPackage.priceAmount, f.selectedPackage.currency)
                      : 'PKR —'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-2xs text-brand-800 font-semibold mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Pay Cash or JazzCash after service is delivered</span>
                </div>
              </div>
            </div>

            {/* Support Helpline Card */}
            <div className="p-4 rounded-2xl bg-white border border-ink-100 text-xs text-ink-600 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-ink-900">Need help booking?</p>
                  <p className="text-2xs text-ink-400">Call care desk 24/7</p>
                </div>
              </div>
              <a
                href="tel:+923001234567"
                className="text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                +92 300 1234567
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Stepper
// ──────────────────────────────────────────────────────────────────────────────
function Stepper({
  currentStep,
  onStepClick,
}: {
  currentStep: StepNumber;
  onStepClick: (s: StepNumber) => void;
}): JSX.Element {
  const steps: StepNumber[] = [1, 2, 3, 4];
  return (
    <ol className="flex items-center justify-between w-full">
      {steps.map((step, idx) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <li key={step} className="flex-1 flex items-center">
            <button
              type="button"
              onClick={() => (step <= currentStep ? onStepClick(step) : undefined)}
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
              disabled={step > currentStep}
            >
              <div
                className={clsx(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200',
                  isDone && 'bg-emerald-600 text-white shadow-soft group-hover:scale-105',
                  isActive && 'bg-gradient-brand text-white shadow-brand ring-4 ring-brand-100 scale-105',
                  !isDone && !isActive && 'bg-ink-100 text-ink-400 ring-1 ring-ink-200',
                )}
              >
                {isDone ? <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" /> : step}
              </div>
              <div className="hidden md:block text-left">
                <p
                  className={clsx(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isActive ? 'text-brand-700' : 'text-ink-400',
                  )}
                >
                  Step {step}
                </p>
                <p
                  className={clsx(
                    'text-xs sm:text-sm font-bold truncate max-w-[140px]',
                    isActive ? 'text-ink-900' : 'text-ink-500',
                  )}
                >
                  {STEP_TITLES[step]}
                </p>
              </div>
            </button>
            {idx < steps.length - 1 ? (
              <div
                className={clsx(
                  'flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-300',
                  isDone ? 'bg-emerald-500' : 'bg-ink-100',
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1 — Service + Package (+ Doctor for VISITING_DOCTOR)
// ──────────────────────────────────────────────────────────────────────────────
function Step1({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Choose Service */}
      <div>
        <label className="text-sm font-bold text-ink-900 block mb-1">
          1. Select Care Service
        </label>
        <p className="text-xs text-ink-500 mb-3.5">
          Choose the healthcare category required for the patient at home.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {form.services.map((s) => {
            const active = s.id === form.selectedServiceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => form.selectService(s.id)}
                className={clsx(
                  'text-left p-4 rounded-2xl ring-1 transition-all duration-200 relative group',
                  active
                    ? 'bg-gradient-brand-soft ring-2 ring-brand-500 shadow-brand -translate-y-0.5'
                    : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card hover:-translate-y-0.5',
                )}
              >
                {active && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
                <div
                  className={clsx(
                    'h-11 w-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105',
                    active ? 'bg-brand-600 text-white shadow-sm' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {SERVICE_ICON[s.code] ?? <Stethoscope className="h-5 w-5" />}
                </div>
                <p className="font-bold text-ink-900 text-sm">{s.name}</p>
                <p className="text-xs text-ink-500 mt-1 line-clamp-2 leading-relaxed">
                  {s.description ?? 'Hospital-standard clinical service delivered at home.'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Doctor picker — only shown for VISITING_DOCTOR */}
      {form.isVisitingDoctorService ? (
        <div className="pt-6 border-t border-ink-100">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-ink-900">
              2. Select a Doctor <span className="text-ink-400 font-normal">(optional)</span>
            </label>
            {form.selectedDoctorId ? (
              <button
                type="button"
                onClick={() => form.selectDoctor(null)}
                className="text-xs text-ink-500 hover:text-danger-600 flex items-center gap-1 transition-colors font-medium"
              >
                <X className="h-3 w-3" /> Clear selection
              </button>
            ) : null}
          </div>
          <p className="text-xs text-ink-500 mb-3.5">
            Select a verified physician, or skip to let our clinical coordinator automatically assign the nearest available doctor.
          </p>

          {form.isLoadingDoctors ? (
            <LoadingSpinner size="md" className="py-6" />
          ) : form.doctors.length === 0 ? (
            <div className="p-4 text-xs text-ink-600 bg-ink-50 rounded-2xl border border-ink-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-600 flex-shrink-0" />
              <span>Admin triage desk will assign the nearest vetted PMDC physician upon submission.</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {form.doctors.map((doc) => {
                const active = doc.userId === form.selectedDoctorId;
                return (
                  <button
                    key={doc.userId}
                    type="button"
                    onClick={() => form.selectDoctor(active ? null : doc.userId)}
                    className={clsx(
                      'text-left p-4 rounded-2xl ring-1 transition-all flex items-center gap-3.5',
                      active
                        ? 'bg-gradient-brand-soft ring-2 ring-brand-500 shadow-brand -translate-y-0.5'
                        : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card',
                    )}
                  >
                    <div
                      className={clsx(
                        'h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-xs',
                        active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700',
                      )}
                    >
                      {doc.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-ink-900 text-sm truncate">{doc.user.fullName}</p>
                        <BadgeCheck className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {doc.experienceYears > 0 ? `${doc.experienceYears}y clinical exp` : 'Verified Doctor'}
                        {doc.city ? ` · ${doc.city.name}` : ''}
                      </p>
                    </div>
                    {active ? <CheckCircle2 className="h-5 w-5 text-brand-700 flex-shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Package Picker */}
      {form.selectedServiceId ? (
        <div className="pt-6 border-t border-ink-100">
          <label className="text-sm font-bold text-ink-900 block mb-1">
            {form.isVisitingDoctorService ? '3.' : '2.'} Choose Care Package &amp; Duration
          </label>
          <p className="text-xs text-ink-500 mb-3.5">
            Select per-visit, weekly, or monthly ongoing healthcare plans.
          </p>

          {form.isLoadingPackages ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : form.packages.length === 0 ? (
            <p className="text-xs text-ink-500 py-4 text-center bg-ink-50 rounded-2xl">
              No packages found for this service.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3.5">
              {form.packages.map((p) => {
                const active = p.id === form.selectedPackageId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => form.selectPackage(p.id)}
                    className={clsx(
                      'text-left p-5 rounded-2xl ring-1 transition-all duration-200 relative group',
                      active
                        ? 'bg-gradient-brand-soft ring-2 ring-brand-500 shadow-brand -translate-y-0.5'
                        : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card hover:-translate-y-0.5',
                    )}
                  >
                    {active ? (
                      <div className="absolute top-4 right-4 h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : null}

                    <Badge tone={p.packageType === 'MONTHLY' ? 'accent' : 'brand'} size="sm">
                      {p.packageType.replace('_', ' ')}
                    </Badge>

                    <p className="font-bold text-ink-900 text-base mt-2.5">{p.name}</p>
                    <p className="text-xs text-ink-500 mt-1">
                      {p.visitCount} visit{p.visitCount > 1 ? 's' : ''} · {p.durationDays} day{p.durationDays > 1 ? 's' : ''} coverage
                    </p>

                    <div className="mt-4 pt-3 border-t border-ink-100/80 flex items-baseline justify-between">
                      <span className="text-2xs text-ink-400 font-semibold uppercase">Pricing</span>
                      <span className="text-xl font-extrabold text-brand-800">
                        {formatCurrency(p.priceAmount, p.currency)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2 — Patient + Address
// ──────────────────────────────────────────────────────────────────────────────
function Step2({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemovePatient = async (id: string): Promise<void> => {
    setRemovingId(id);
    try {
      await api.delete(API.USERS.PATIENT_BY_ID(id));
      form.removePatient(id);
    } catch {
      toast.error('Cannot remove — patient may have active bookings.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAddress = async (id: string): Promise<void> => {
    setRemovingId(id);
    try {
      await api.delete(API.USERS.ADDRESS_BY_ID(id));
      form.removeAddress(id);
    } catch {
      toast.error('Cannot remove — address may have active bookings.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Patient Section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
            <User className="h-4 w-4 text-brand-600" />
            <span>Select Patient</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setPatientModalOpen(true)}
            className="rounded-xl text-xs font-bold"
          >
            Add Patient
          </Button>
        </div>
        <p className="text-xs text-ink-500 mb-3.5">
          The person who will be receiving care (yourself, parent, child, or family member).
        </p>

        {form.patients.length === 0 ? (
          <button
            type="button"
            onClick={() => setPatientModalOpen(true)}
            className="w-full p-6 rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all text-center group"
          >
            <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-ink-800 mt-2.5 group-hover:text-brand-700">
              Add your first patient profile
            </p>
            <p className="text-xs text-ink-500 mt-1">
              Save name, age, primary condition, and allergies for clinical safety.
            </p>
          </button>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3.5">
            {form.patients.map((p) => {
              const active = p.id === form.selectedPatientId;
              return (
                <div
                  key={p.id}
                  className={clsx(
                    'relative rounded-2xl ring-1 transition-all p-4 cursor-pointer group',
                    active
                      ? 'bg-gradient-brand-soft ring-2 ring-brand-500 shadow-brand -translate-y-0.5'
                      : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card',
                  )}
                  onClick={() => form.selectPatient(p.id)}
                >
                  <div className="flex items-start gap-3 pr-16">
                    <div
                      className={clsx(
                        'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors',
                        active ? 'bg-brand-600 text-white shadow-xs' : 'bg-brand-100 text-brand-800',
                      )}
                    >
                      {p.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-ink-900 text-sm truncate">{p.fullName}</p>
                        {active ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white flex-shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5 truncate">
                        {p.relationshipToCustomer ?? 'Family Member'}
                        {p.primaryCondition ? ` · ${p.primaryCondition}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPatient(p);
                      }}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemovePatient(p.id);
                      }}
                      disabled={removingId === p.id}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      {removingId === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Address Section */}
      <div className="pt-6 border-t border-ink-100">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-600" />
            <span>Service Address</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setAddressModalOpen(true)}
            className="rounded-xl text-xs font-bold"
          >
            Add Address
          </Button>
        </div>
        <p className="text-xs text-ink-500 mb-3.5">
          The residence or location in Faisalabad where our medical specialist should arrive.
        </p>

        {form.addresses.length === 0 ? (
          <button
            type="button"
            onClick={() => setAddressModalOpen(true)}
            className="w-full p-6 rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all text-center group"
          >
            <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-ink-800 mt-2.5 group-hover:text-brand-700">
              Add a home service address
            </p>
            <p className="text-xs text-ink-500 mt-1">Street address, colony/area, and phone number for dispatch.</p>
          </button>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3.5">
            {form.addresses.map((a) => {
              const active = a.id === form.selectedAddressId;
              return (
                <div
                  key={a.id}
                  className={clsx(
                    'relative rounded-2xl ring-1 transition-all p-4 cursor-pointer group',
                    active
                      ? 'bg-gradient-brand-soft ring-2 ring-brand-500 shadow-brand -translate-y-0.5'
                      : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card',
                  )}
                  onClick={() => form.selectAddress(a.id)}
                >
                  <div className="flex items-start gap-3 pr-16">
                    <div
                      className={clsx(
                        'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors',
                        active ? 'bg-brand-600 text-white shadow-xs' : 'bg-brand-100 text-brand-800',
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-ink-900 text-sm truncate">{a.label ?? a.area}</p>
                        {active ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white flex-shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2 leading-snug">
                        {a.line1.toLowerCase().includes(a.area.toLowerCase()) ? a.line1 : `${a.line1}, ${a.area}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-2xs text-ink-400 font-mono">{a.contactPhone}</span>
                        {a.latitude != null && a.longitude != null ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <MapPin className="h-2.5 w-2.5" />
                            GPS Pin
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAddress(a);
                      }}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRemoveAddress(a.id);
                      }}
                      disabled={removingId === a.id}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      {removingId === a.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PatientFormModal
        open={patientModalOpen || editingPatient !== null}
        initialData={editingPatient ?? undefined}
        onClose={() => {
          setPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onCreated={(p) => {
          form.addPatient(p);
          setPatientModalOpen(false);
        }}
        onUpdated={(p) => {
          form.updatePatient(p);
          setEditingPatient(null);
        }}
      />
      <AddressFormModal
        open={addressModalOpen || editingAddress !== null}
        initialData={editingAddress ?? undefined}
        onClose={() => {
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onCreated={(a) => {
          form.addAddress(a);
          setAddressModalOpen(false);
        }}
        onUpdated={(a) => {
          form.updateAddress(a);
          setEditingAddress(null);
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3 — Date + Preferences
// ──────────────────────────────────────────────────────────────────────────────
function Step3({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date & Time Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-brand-600" />
            <span>Preferred Date</span>
          </label>
          <input
            type="date"
            value={form.requestedDate}
            onChange={(e) => form.setRequestedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-ink-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-brand-600" />
            <span>Preferred Time</span>
          </label>
          <input
            type="time"
            value={form.requestedTime}
            onChange={(e) => form.setRequestedTime(e.target.value)}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-ink-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white"
          />
        </div>
      </div>

      {/* Urgency Level Selector */}
      <div className="pt-4 border-t border-ink-100">
        <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
          Clinical Urgency Level
        </label>
        <p className="text-xs text-ink-500 mb-3">
          Select response priority. For urgent requests, our coordinator dispatches within 45–60 mins.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['NORMAL', 'URGENT', 'EMERGENCY'] as const).map((u) => {
            const active = form.urgencyLevel === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => form.setUrgencyLevel(u)}
                className={clsx(
                  'p-3.5 rounded-2xl text-left border transition-all relative',
                  active && u === 'NORMAL' && 'bg-brand-50/70 border-brand-500 shadow-sm ring-1 ring-brand-500',
                  active && u === 'URGENT' && 'bg-warning-50/70 border-warning-500 shadow-sm ring-1 ring-warning-500',
                  active && u === 'EMERGENCY' && 'bg-danger-50/70 border-danger-500 shadow-sm ring-1 ring-danger-500',
                  !active && 'bg-white border-ink-200 hover:border-ink-300',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm text-ink-900 capitalize">
                    {u.toLowerCase()} Care
                  </span>
                  {u === 'EMERGENCY' && <AlertTriangle className="h-4 w-4 text-danger-600" />}
                </div>
                <p className="text-2xs text-ink-500 mt-1">
                  {u === 'NORMAL' && 'Standard scheduled appointment'}
                  {u === 'URGENT' && 'Priority arrival under 60 minutes'}
                  {u === 'EMERGENCY' && 'Immediate triage & dispatch'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Gender Preference */}
      <div className="pt-4 border-t border-ink-100">
        <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
          Staff Gender Preference <span className="text-ink-400 font-normal lowercase">(optional)</span>
        </label>
        <p className="text-xs text-ink-500 mb-3">
          Feel free to specify a female or male nurse/caregiver for patient comfort.
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { val: '', label: 'No Preference' },
            { val: 'FEMALE', label: 'Female Staff' },
            { val: 'MALE', label: 'Male Staff' },
          ].map((item) => {
            const active = form.preferredGender === item.val;
            return (
              <button
                key={item.val}
                type="button"
                onClick={() => form.setPreferredGender(item.val as '' | 'FEMALE' | 'MALE')}
                className={clsx(
                  'px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center',
                  active
                    ? 'bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500'
                    : 'bg-white border-ink-200 text-ink-700 hover:border-ink-300',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="pt-4 border-t border-ink-100">
        <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1">
          Clinical Notes &amp; Special Instructions <span className="text-ink-400 font-normal lowercase">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={form.specialInstructions}
          onChange={(e) => form.setSpecialInstructions(e.target.value)}
          placeholder="e.g. Patient is bedridden, please bring IV stand, allergic to penicillin, gate entry instructions..."
          className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl border border-ink-200 hover:border-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none bg-white"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 4 — Review & Final Confirmation
// ──────────────────────────────────────────────────────────────────────────────
function Step4({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/60 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-brand-700 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-ink-900 text-xs sm:text-sm">Please review your home visit details</p>
          <p className="text-2xs sm:text-xs text-ink-600 mt-0.5 leading-relaxed">
            Upon clicking confirm, our medical triage coordinator receives your request immediately. Zero deposit is needed.
          </p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="rounded-2xl border border-ink-100 divide-y divide-ink-100 bg-ink-50/40 p-1">
        <SummaryRow
          label="Care Service"
          value={form.selectedService?.name ?? '—'}
          subValue={form.selectedPackage?.name}
        />
        <SummaryRow
          label="Package Tier"
          value={
            form.selectedPackage
              ? `${form.selectedPackage.visitCount} visit${form.selectedPackage.visitCount > 1 ? 's' : ''} · ${form.selectedPackage.durationDays} day duration`
              : '—'
          }
          subValue={
            form.selectedPackage
              ? formatCurrency(form.selectedPackage.priceAmount, form.selectedPackage.currency)
              : undefined
          }
        />
        {form.selectedDoctorId ? (
          <SummaryRow
            label="Physician"
            value={form.doctors.find((d) => d.userId === form.selectedDoctorId)?.user.fullName ?? '—'}
            subValue="Assigned doctor will review patient notes"
          />
        ) : null}
        <SummaryRow
          label="Patient Name"
          value={form.selectedPatient?.fullName ?? '—'}
          subValue={form.selectedPatient?.relationshipToCustomer ?? 'Family Member'}
        />
        <SummaryRow
          label="Home Address"
          value={form.selectedAddress?.line1 ?? '—'}
          subValue={`${form.selectedAddress?.area}, Faisalabad`}
        />
        <SummaryRow
          label="Appointment Date"
          value={`${formatDate(form.requestedDate, 'EEEE, dd MMM yyyy')} · ${form.requestedTime}`}
        />
        <SummaryRow label="Urgency Priority" value={form.urgencyLevel.toLowerCase()} />
        {form.preferredGender ? (
          <SummaryRow label="Gender Preference" value={form.preferredGender.toLowerCase()} />
        ) : null}
        {form.specialInstructions ? (
          <SummaryRow label="Clinical Notes" value={form.specialInstructions} />
        ) : null}
      </div>

      {/* Final Total Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-950 to-teal-950 text-white shadow-xl space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-2xs uppercase tracking-wider text-brand-200 font-bold">Total Service Fee</p>
            <p className="text-xs text-brand-100/70">Inclusive of sterile kits, transportation &amp; reports</p>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {form.selectedPackage
              ? formatCurrency(form.selectedPackage.priceAmount, form.selectedPackage.currency)
              : '—'}
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-2xs text-brand-200">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Pay Cash on Delivery or JazzCash after visit</span>
          </span>
          <span className="font-bold text-white">Zero Prepayment</span>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 bg-white first:rounded-t-xl last:rounded-b-xl">
      <p className="text-xs font-bold text-ink-500 uppercase tracking-wider w-36 flex-shrink-0">{label}</p>
      <div className="flex-1 text-right">
        <p className="font-bold text-ink-900 text-xs sm:text-sm capitalize">{value}</p>
        {subValue ? <p className="text-2xs text-ink-500 mt-0.5 leading-relaxed">{subValue}</p> : null}
      </div>
    </div>
  );
}
