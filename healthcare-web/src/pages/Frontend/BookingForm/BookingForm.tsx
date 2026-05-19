import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Heart,
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
  ChevronDown,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Card } from '../../../constant/Card';
import { Badge } from '../../../constant/Badge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { EmptyState } from '../../../component/common/EmptyState';
import { formatCurrency, formatDate } from '../../../helper/format';
import { useBookingForm, type StepNumber } from './useBookingForm';

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

export function BookingForm(): JSX.Element {
  const f = useBookingForm();

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
              <Heart className="h-4 w-4" fill="currentColor" />
            </div>
            <p className="font-bold text-ink-900">HomeHealth</p>
          </Link>
          <Link to="/my-bookings" className="text-sm font-medium text-ink-600 hover:text-ink-900">
            My bookings →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stepper */}
        <Stepper currentStep={f.currentStep} onStepClick={f.goToStep} />

        {/* Step content */}
        <Card padding="lg" variant="elevated" className="mt-8 animate-slide-up min-h-[28rem]">
          {f.isLoadingInitial ? (
            <LoadingSpinner size="lg" label="Preparing your booking…" className="py-20" />
          ) : (
            <>
              <div className="mb-6">
                <p className="text-xs font-mono uppercase tracking-wider text-brand-700">
                  Step {f.currentStep} of 4
                </p>
                <h2 className="text-2xl font-bold text-ink-900 mt-1">{STEP_TITLES[f.currentStep]}</h2>
              </div>

              {f.currentStep === 1 ? <Step1 form={f} /> : null}
              {f.currentStep === 2 ? <Step2 form={f} /> : null}
              {f.currentStep === 3 ? <Step3 form={f} /> : null}
              {f.currentStep === 4 ? <Step4 form={f} /> : null}

              {f.stepError ? (
                <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
                  {f.stepError}
                </div>
              ) : null}

              {/* Nav buttons */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-ink-100">
                <Button
                  variant="outline"
                  onClick={f.goBack}
                  disabled={f.currentStep === 1 || f.isSubmitting}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                {f.currentStep < 4 ? (
                  <Button
                    onClick={f.goNext}
                    disabled={!f.canProceed}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => void f.submit()}
                    isLoading={f.isSubmitting}
                    rightIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Confirm booking
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
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
    <ol className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <li key={step} className="flex-1 flex items-center">
            <button
              type="button"
              onClick={() => (step <= currentStep ? onStepClick(step) : undefined)}
              className="flex items-center gap-3 group"
              disabled={step > currentStep}
            >
              <div
                className={clsx(
                  'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  isDone && 'bg-success-500 text-white shadow-soft',
                  isActive && 'bg-gradient-brand text-white shadow-brand ring-4 ring-brand-100',
                  !isDone && !isActive && 'bg-white text-ink-400 ring-1 ring-ink-200',
                )}
              >
                {isDone ? <Check className="h-5 w-5" /> : step}
              </div>
              <div className="hidden sm:block text-left">
                <p
                  className={clsx(
                    'text-xs font-semibold uppercase tracking-wider',
                    isActive ? 'text-brand-700' : 'text-ink-500',
                  )}
                >
                  Step {step}
                </p>
                <p
                  className={clsx(
                    'text-sm font-semibold',
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
                  'flex-1 h-0.5 mx-3 sm:mx-5 rounded-full transition-colors',
                  isDone ? 'bg-success-500' : 'bg-ink-200',
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
// Step 1 — Service + Package
// ──────────────────────────────────────────────────────────────────────────────
function Step1({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <label className="text-sm font-semibold text-ink-800">Choose a service</label>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {form.services.map((s) => {
            const active = s.id === form.selectedServiceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => form.selectService(s.id)}
                className={clsx(
                  'text-left p-4 rounded-xl ring-1 transition-all',
                  active
                    ? 'bg-gradient-brand-soft ring-brand-500 shadow-brand'
                    : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card',
                )}
              >
                <div
                  className={clsx(
                    'h-10 w-10 rounded-lg flex items-center justify-center mb-3',
                    active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700',
                  )}
                >
                  {SERVICE_ICON[s.code] ?? <Stethoscope className="h-5 w-5" />}
                </div>
                <p className="font-semibold text-ink-900">{s.name}</p>
                <p className="text-xs text-ink-500 mt-1 line-clamp-2">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {form.selectedServiceId ? (
        <div>
          <label className="text-sm font-semibold text-ink-800">Choose a package</label>
          {form.isLoadingPackages ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : form.packages.length === 0 ? (
            <p className="text-sm text-ink-500 mt-3">No packages available for this service.</p>
          ) : (
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {form.packages.map((p) => {
                const active = p.id === form.selectedPackageId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => form.selectPackage(p.id)}
                    className={clsx(
                      'text-left p-5 rounded-xl ring-1 transition-all relative',
                      active
                        ? 'bg-gradient-brand-soft ring-brand-500 shadow-brand'
                        : 'bg-white ring-ink-200 hover:ring-brand-300 hover:shadow-card',
                    )}
                  >
                    {active ? (
                      <CheckCircle2 className="absolute top-4 right-4 h-5 w-5 text-brand-700" />
                    ) : null}
                    <Badge tone={p.packageType === 'MONTHLY' ? 'accent' : 'brand'} size="sm">
                      {p.packageType.replace('_', ' ')}
                    </Badge>
                    <p className="font-semibold text-ink-900 mt-3">{p.name}</p>
                    <p className="text-xs text-ink-500 mt-1">
                      {p.visitCount} visit{p.visitCount > 1 ? 's' : ''} · {p.durationDays} day{p.durationDays > 1 ? 's' : ''}
                    </p>
                    <p className="mt-4 text-2xl font-bold text-brand-700">
                      {formatCurrency(p.priceAmount, p.currency)}
                    </p>
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
  return (
    <div className="space-y-8">
      <div>
        <label className="text-sm font-semibold text-ink-800 flex items-center gap-2">
          <User className="h-4 w-4 text-brand-600" />
          Patient
        </label>
        {form.patients.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No patients on file yet"
              description="Add a patient under your account before booking. (Coming soon — for now, contact us via WhatsApp.)"
            />
          </div>
        ) : (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {form.patients.map((p) => {
              const active = p.id === form.selectedPatientId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => form.selectPatient(p.id)}
                  className={clsx(
                    'text-left p-4 rounded-xl ring-1 transition-all',
                    active
                      ? 'bg-gradient-brand-soft ring-brand-500'
                      : 'bg-white ring-ink-200 hover:ring-brand-300',
                  )}
                >
                  <p className="font-semibold text-ink-900">{p.fullName}</p>
                  <p className="text-xs text-ink-500 mt-1">
                    {p.relationshipToCustomer ?? 'Family member'}
                    {p.primaryCondition ? ` · ${p.primaryCondition}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-800 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-600" />
          Service address
        </label>
        {form.addresses.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No saved addresses"
              description="Add an address before booking. (Coming soon — for now, contact us via WhatsApp.)"
            />
          </div>
        ) : (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {form.addresses.map((a) => {
              const active = a.id === form.selectedAddressId;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => form.selectAddress(a.id)}
                  className={clsx(
                    'text-left p-4 rounded-xl ring-1 transition-all',
                    active
                      ? 'bg-gradient-brand-soft ring-brand-500'
                      : 'bg-white ring-ink-200 hover:ring-brand-300',
                  )}
                >
                  <p className="font-semibold text-ink-900">{a.label ?? a.area}</p>
                  <p className="text-xs text-ink-500 mt-1">
                    {a.line1}, {a.area}
                  </p>
                  <p className="text-2xs text-ink-400 mt-1">{a.contactPhone}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3 — Date + Preferences
// ──────────────────────────────────────────────────────────────────────────────
function Step3({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">
            <Calendar className="h-4 w-4 inline mr-1.5 text-brand-600" />
            Preferred date
          </label>
          <input
            type="date"
            value={form.requestedDate}
            onChange={(e) => form.setRequestedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="px-4 py-2.5 text-sm rounded-xl border border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-700">
            <Clock className="h-4 w-4 inline mr-1.5 text-brand-600" />
            Preferred time
          </label>
          <input
            type="time"
            value={form.requestedTime}
            onChange={(e) => form.setRequestedTime(e.target.value)}
            className="px-4 py-2.5 text-sm rounded-xl border border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 block mb-2">Urgency</label>
        <div className="grid grid-cols-3 gap-2">
          {(['NORMAL', 'URGENT', 'EMERGENCY'] as const).map((u) => {
            const active = form.urgencyLevel === u;
            const tone = u === 'EMERGENCY' ? 'danger' : u === 'URGENT' ? 'warning' : 'brand';
            return (
              <button
                key={u}
                type="button"
                onClick={() => form.setUrgencyLevel(u)}
                className={clsx(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold ring-1 transition-all',
                  active && tone === 'brand' && 'bg-brand-50 text-brand-700 ring-brand-500',
                  active && tone === 'warning' && 'bg-warning-50 text-warning-700 ring-warning-500',
                  active && tone === 'danger' && 'bg-danger-50 text-danger-700 ring-danger-500',
                  !active && 'bg-white text-ink-600 ring-ink-200 hover:ring-ink-300',
                )}
              >
                {u === 'EMERGENCY' ? (
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5" />
                ) : null}
                {u.charAt(0) + u.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 block mb-2">
          Preferred staff gender <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            value={form.preferredGender}
            onChange={(e) => form.setPreferredGender(e.target.value as '' | 'MALE' | 'FEMALE' | 'OTHER')}
            className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none bg-white"
          >
            <option value="">No preference</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink-700 block mb-2">
          Special instructions <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={form.specialInstructions}
          onChange={(e) => form.setSpecialInstructions(e.target.value)}
          placeholder="Patient allergies, mobility needs, equipment available, etc."
          className="w-full px-4 py-3 text-sm rounded-xl border border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 4 — Review
// ──────────────────────────────────────────────────────────────────────────────
function Step4({ form }: { form: ReturnType<typeof useBookingForm> }): JSX.Element {
  return (
    <div className="space-y-4">
      <SummaryRow
        label="Service"
        value={form.selectedService?.name ?? '—'}
        subValue={form.selectedPackage?.name}
      />
      <SummaryRow
        label="Package"
        value={
          form.selectedPackage
            ? `${form.selectedPackage.visitCount} visit${form.selectedPackage.visitCount > 1 ? 's' : ''} · ${form.selectedPackage.durationDays}d`
            : '—'
        }
        subValue={
          form.selectedPackage
            ? formatCurrency(form.selectedPackage.priceAmount, form.selectedPackage.currency)
            : undefined
        }
      />
      <SummaryRow label="Patient" value={form.selectedPatient?.fullName ?? '—'} />
      <SummaryRow
        label="Address"
        value={form.selectedAddress?.line1 ?? '—'}
        subValue={form.selectedAddress?.area}
      />
      <SummaryRow
        label="Scheduled"
        value={`${formatDate(form.requestedDate, 'EEEE, dd MMM yyyy')} · ${form.requestedTime}`}
      />
      <SummaryRow label="Urgency" value={form.urgencyLevel.toLowerCase()} />
      {form.preferredGender ? <SummaryRow label="Preferred gender" value={form.preferredGender} /> : null}
      {form.specialInstructions ? <SummaryRow label="Instructions" value={form.specialInstructions} /> : null}

      <div className="mt-6 p-5 rounded-xl bg-gradient-brand-soft ring-1 ring-brand-200">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold text-ink-900">Total</p>
          <p className="text-3xl font-bold text-brand-700">
            {form.selectedPackage
              ? formatCurrency(form.selectedPackage.priceAmount, form.selectedPackage.currency)
              : '—'}
          </p>
        </div>
        <p className="text-xs text-ink-600 mt-2">Pay after care delivered. No charges until confirmed.</p>
      </div>

      <p className="text-2xs text-ink-500 text-center mt-4">
        <Loader2 className="inline h-3 w-3 mr-1" />
        Confirming creates the booking. You&rsquo;ll get a WhatsApp acknowledgement within minutes.
      </p>
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
    <div className="flex items-start justify-between gap-4 py-3 border-b border-ink-100 last:border-b-0">
      <p className="text-sm font-medium text-ink-500 capitalize w-32 flex-shrink-0">{label}</p>
      <div className="flex-1 text-right">
        <p className="font-semibold text-ink-900 capitalize">{value}</p>
        {subValue ? <p className="text-xs text-ink-500 mt-0.5">{subValue}</p> : null}
      </div>
    </div>
  );
}
