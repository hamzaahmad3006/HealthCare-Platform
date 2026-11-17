import React from 'react';
import { Controller } from 'react-hook-form';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Briefcase,
  Siren,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useCompleteProfile } from './useCompleteProfile';

const GENDERS: Array<{ id: 'MALE' | 'FEMALE' | 'OTHER'; label: string }> = [
  { id: 'MALE', label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
  { id: 'OTHER', label: 'Other' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.06,
      when: 'beforeChildren',
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function CompleteProfile(): JSX.Element {
  const c = useCompleteProfile();
  const { register, handleSubmit, formState, control, watch } = c.form;

  if (c.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-ink-100 flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" label="Loading clinician profile…" />
          <p className="text-xs text-ink-500 font-medium">Fetching verified cities &amp; clinical services</p>
        </div>
      </div>
    );
  }

  const currentZone = watch('zoneId');
  const isOtherZone = currentZone === 'OTHER';
  const cnicVal = watch('cnic') ?? '';
  const isCnicComplete = cnicVal.length === 13;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/20 to-indigo-50/30 px-4 py-4 sm:px-6 sm:py-6 relative overflow-x-hidden flex flex-col justify-center">
      {/* Decorative background glow orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-200/25 rounded-full blur-3xl pointer-events-none -z-10 animate-float-slow" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-10 animate-float-reverse" />

      <motion.div
        className="max-w-5xl w-full mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Brand header & Milestones Top Bar */}
        <motion.div variants={itemVariants} className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <BrandLogo asLink to="/" size="sm" subtitleText="CLINICIAN ONBOARDING" />
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 py-2 border border-ink-200/70 shadow-xs flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-brand-700">
              <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                1
              </span>
              <span>Credentials</span>
            </div>
            <ArrowRight className="h-3 w-3 text-ink-300" />
            <div className="flex items-center gap-1.5 text-ink-400">
              <span className="h-5 w-5 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center font-bold text-[10px]">
                2
              </span>
              <span>Documents</span>
            </div>
            <ArrowRight className="h-3 w-3 text-ink-300" />
            <div className="flex items-center gap-1.5 text-ink-400">
              <span className="h-5 w-5 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center font-bold text-[10px]">
                3
              </span>
              <span>Deployment</span>
            </div>
          </div>
        </motion.div>

        {/* Main 2-Column Responsive Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl shadow-xl border border-ink-200/80 p-5 sm:p-7 relative overflow-hidden"
        >
          {/* Header Strip */}
          <div className="border-b border-ink-100 pb-4 mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-ink-900 tracking-tight flex items-center gap-2">
                Welcome, {c.me?.user.fullName.split(' ')[0] ?? 'Clinician'} 👋
              </h1>
              <p className="text-xs sm:text-sm text-ink-600 mt-1 leading-relaxed">
                Complete your operational credentials so administration can verify your medical license.
              </p>
            </div>
            <div className="px-3 py-2 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 text-center flex-shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                Staff Code
              </span>
              <span className="font-mono text-xs font-black text-brand-700 block mt-0.5">
                {c.me?.staffCode ?? 'STF-PENDING'}
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(c.onSubmit)();
            }}
            className="space-y-6"
          >
            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ── LEFT COLUMN (6 cols): Identity & Coverage ──────────── */}
              <div className="lg:col-span-6 space-y-5">
                {/* Section 1: Clinical Identity */}
                <motion.div variants={itemVariants} className="space-y-3.5">
                  <SectionHeader
                    icon={<CreditCard className="h-4 w-4" />}
                    title="Identity &amp; Demographics"
                    badge="PMDC / PNC"
                  />

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <Controller
                      control={control}
                      name="cnic"
                      render={({ field }) => (
                        <div>
                          <Input
                            label="CNIC (ID Card) *"
                            placeholder="3520112345671"
                            inputMode="numeric"
                            maxLength={13}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 13);
                              field.onChange(digitsOnly);
                            }}
                            onPaste={(e) => {
                              e.preventDefault();
                              const pasted = e.clipboardData.getData('text');
                              const digitsOnly = pasted.replace(/\D/g, '').slice(0, 13);
                              field.onChange(digitsOnly);
                            }}
                            error={formState.errors.cnic?.message}
                          />
                          <div className="flex items-center justify-between text-[11px] mt-1 px-0.5 font-medium">
                            <span className="text-ink-400">Strictly 13 numbers</span>
                            <motion.span
                              animate={{ scale: isCnicComplete ? [1, 1.1, 1] : 1 }}
                              transition={{ duration: 0.2 }}
                              className={
                                isCnicComplete
                                  ? 'text-emerald-600 font-bold flex items-center gap-1'
                                  : 'text-ink-500 font-medium'
                              }
                            >
                              {isCnicComplete ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  13/13 complete
                                </>
                              ) : (
                                `${cnicVal.length}/13`
                              )}
                            </motion.span>
                          </div>
                        </div>
                      )}
                    />

                    <Input
                      label="Date of birth *"
                      type="date"
                      error={formState.errors.dateOfBirth?.message}
                      {...register('dateOfBirth')}
                    />
                  </div>

                  {/* Gender selector */}
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1.5">
                          Gender Identity
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {GENDERS.map((g) => {
                            const active = field.value === g.id;
                            return (
                              <motion.button
                                type="button"
                                key={g.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => field.onChange(g.id)}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                  active
                                    ? 'bg-brand-600 text-white border-brand-700 shadow-sm shadow-brand-500/20'
                                    : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:bg-brand-50/20'
                                }`}
                              >
                                {active ? <Check className="h-3.5 w-3.5" /> : null}
                                <span>{g.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  />
                </motion.div>

                {/* Section 2: Coverage Location */}
                <motion.div variants={itemVariants} className="space-y-3.5 pt-1">
                  <SectionHeader
                    icon={<MapPin className="h-4 w-4" />}
                    title="Service Area &amp; Zone"
                    badge="Faisalabad"
                  />

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <Select
                      label="Operational City *"
                      error={formState.errors.cityId?.message}
                      {...register('cityId')}
                    >
                      <option value="">— Select city —</option>
                      {c.cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Designated Zone / Locality"
                      disabled={!c.form.watch('cityId')}
                      error={formState.errors.zoneId?.message}
                      {...register('zoneId')}
                    >
                      <option value="">— Select zone —</option>
                      {c.zonesForSelectedCity.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                      <option value="OTHER">Other (Specify below)</option>
                    </Select>
                  </div>

                  {/* Dynamic Animated "Other Zone" Field */}
                  <AnimatePresence>
                    {isOtherZone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            <span>Specify Custom Area</span>
                          </div>
                          <Input
                            label="Your Zone / Area Name *"
                            placeholder="e.g. Sargodha Road, Millat Town, Jhang Road..."
                            helperText="Provide your neighborhood or road name in Faisalabad"
                            error={formState.errors.customZoneName?.message}
                            {...register('customZoneName')}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* ── RIGHT COLUMN (6 cols): Experience & Services ─────── */}
              <div className="lg:col-span-6 space-y-5 flex flex-col justify-between h-full">
                <motion.div variants={itemVariants} className="space-y-3.5">
                  <SectionHeader
                    icon={<Briefcase className="h-4 w-4" />}
                    title="Experience &amp; Services"
                    badge="Multi-Select"
                  />

                  <Input
                    label="Clinical Experience (Years) *"
                    type="number"
                    min={0}
                    max={60}
                    helperText="Total years of medical or healthcare clinical practice"
                    error={formState.errors.experienceYears?.message}
                    {...register('experienceYears')}
                  />

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block mb-1.5">
                      Services you are qualified to deliver *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {c.services.map((svc) => {
                        const active = c.selectedServiceIds.includes(svc.id);
                        return (
                          <motion.button
                            type="button"
                            key={svc.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => c.toggleService(svc.id)}
                            className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all flex items-center justify-between gap-2 ${
                              active
                                ? 'bg-brand-600 text-white border-brand-700 shadow-sm shadow-brand-500/20 ring-1 ring-brand-400'
                                : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300 hover:bg-brand-50/20'
                            }`}
                          >
                            <span className="font-bold truncate">{svc.name}</span>
                            <div
                              className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                active ? 'bg-white text-brand-700' : 'border border-ink-300'
                              }`}
                            >
                              {active ? <Check className="h-3 w-3" /> : null}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                    {formState.errors.serviceTypeIds ? (
                      <p className="text-xs font-medium text-danger-700 mt-1.5">
                        {formState.errors.serviceTypeIds.message}
                      </p>
                    ) : null}
                  </div>

                  {/* Dynamic Ambulance Section */}
                  <AnimatePresence>
                    {c.needsAmbulanceNumber && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -6 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-2xl bg-amber-500/10 border border-amber-300/80 p-3.5">
                          <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse">
                              <Siren className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <Input
                                label="Ambulance License Plate *"
                                placeholder="e.g. FSD-1234 or LE-ABC-123"
                                helperText="Government registration plate for ambulance"
                                error={formState.errors.ambulanceNumber?.message}
                                {...register('ambulanceNumber')}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Next Steps Guidance & Submit CTA */}
                <motion.div variants={itemVariants} className="space-y-3 pt-2">
                  <div className="rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50/70 border border-brand-200/80 p-3 text-xs text-brand-900 flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <span className="font-bold">Next:</span> Upload your PMDC/PNC license and CNIC copy. Admin verification will immediately activate your patient visit calendar.
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                      <Button
                        type="submit"
                        size="lg"
                        isLoading={c.isSubmitting}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        className="w-full sm:w-auto px-7 shadow-lg shadow-brand-600/20 text-xs font-bold"
                      >
                        Save &amp; Continue to Documents
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  badge,
}: {
  icon: JSX.Element;
  title: string;
  badge?: string;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between pb-1.5 border-b border-ink-100">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/60">
          {icon}
        </div>
        <h2 className="text-xs sm:text-sm font-bold text-ink-900 tracking-tight">{title}</h2>
      </div>
      {badge ? (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-ink-100 text-ink-600">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

// Native select styled to match Input.
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(({ label, error, children, disabled, ...rest }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label ? <label className="text-sm font-medium text-ink-700">{label}</label> : null}
    <select
      {...rest}
      ref={ref}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={`w-full bg-white text-ink-900 rounded-xl border px-3.5 py-2 text-xs sm:text-sm transition-all
        ${error
          ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
          : 'border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
        disabled:bg-ink-50 disabled:cursor-not-allowed outline-none cursor-pointer`}
    >
      {children}
    </select>
    {error ? <p className="text-xs font-medium text-danger-700">{error}</p> : null}
  </div>
));
Select.displayName = 'Select';
