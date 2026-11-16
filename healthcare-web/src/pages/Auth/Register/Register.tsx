import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  BadgeCheck,
  Star,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  Clock,
  Sparkles,
  FileText,
  Activity,
  HeartPulse,
  Check,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useRegister } from './useRegister';

export function Register(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError } = useRegister();
  const { register, handleSubmit, formState, control } = form;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-brand-100 selection:text-brand-900">
      {/* ───── Left Column: Registration Form ───── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-gradient-to-b from-ink-50/80 via-white to-brand-50/20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-10 animate-fade-in">
          <BrandLogo asLink to="/" size="md" subtitleText="PAKISTAN" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-600 hover:text-brand-700 transition-all px-3 py-1.5 rounded-xl hover:bg-ink-100/70 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Centered Elevated Form Card */}
        <div className="w-full max-w-lg mx-auto my-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl ring-1 ring-ink-100/80 hover:shadow-2xl transition-shadow duration-300">
            {/* Header info */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 text-2xs font-bold uppercase tracking-wider mb-3 animate-pulse-soft">
                <Sparkles className="h-3 w-3 text-brand-600" />
                <span>Instant Free Registration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                Create patient account
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
                Join 2,500+ families across Pakistan getting hospital-grade healthcare at home.
              </p>

              {/* Quick trust checklist */}
              <div className="mt-4 pt-3 border-t border-ink-100 grid grid-cols-3 gap-2 text-2xs text-ink-600">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-600 stroke-[3]" />
                  Zero Advance
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-600 stroke-[3]" />
                  PNC / PMDC Verified
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-600 stroke-[3]" />
                  24/7 Helpline
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full name"
                placeholder="e.g. Asma Khan"
                leftIcon={<User className="h-4 w-4" />}
                error={formState.errors.fullName?.message}
                {...register('fullName')}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput
                      label="Phone number"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      autoComplete="tel-national"
                      error={formState.errors.phone?.message}
                    />
                  )}
                />

                <Input
                  label="Email address (optional)"
                  type="email"
                  placeholder="asma@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={formState.errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 chars"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="pointer-events-auto p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={formState.errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="pointer-events-auto p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={formState.errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              {serverError ? (
                <div className="px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-xs text-danger-700 animate-slide-down flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{serverError}</span>
                </div>
              ) : null}

              {/* Terms Reassurance */}
              <p className="text-2xs text-ink-500 leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="#terms" className="text-brand-700 hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="text-brand-700 hover:underline">
                  Privacy Policy
                </a>
                . Your health data is encrypted and strictly private.
              </p>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                fullWidth
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl shadow-brand-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Create My Free Account
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 pt-5 border-t border-ink-100 text-center">
              <p className="text-xs sm:text-sm text-ink-600">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="font-bold text-brand-700 hover:text-brand-800 transition-colors underline underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Privacy badge */}
            <div className="mt-5 pt-3 border-t border-ink-100/70 flex items-center justify-center gap-1.5 text-2xs text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>HIPAA-Grade Data Security · 100% Free Registration</span>
            </div>
          </div>
        </div>

        {/* Bottom subtle copyright */}
        <div className="text-center text-2xs text-ink-400 mt-8">
          <p>&copy; {new Date().getFullYear()} HomeHealth Pakistan · 24/7 Helpline: +92 300 1234567</p>
        </div>
      </div>

      {/* ───── Right Column: Visual Benefits Showcase ───── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-teal-950 text-white p-12 xl:p-16 flex-col justify-between">
        {/* Soft background ambient blurs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none animate-float-reverse" />

        {/* Top active status pill */}
        <div className="relative z-10 flex items-center justify-between animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-xs font-semibold text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Zero Advance Fees · Complete Peace of Mind</span>
          </span>

          <span className="text-2xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm hidden xl:inline">
            Faisalabad Network
          </span>
        </div>

        {/* Center content & clinical benefits card */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Hospital Quality,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white block sm:inline">
                At-Home Care.
              </span>
            </h2>
            <p className="text-brand-100 text-sm sm:text-base leading-relaxed font-normal">
              One account connects you with licensed doctors, registered nurses, bedside blood sampling, and permanent
              digital health records.
            </p>
          </div>

          {/* Floating badge */}
          <div className="flex justify-end -mb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-2xs font-semibold text-white shadow-lg animate-float-reverse">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>PNC &amp; PMDC Verified Specialists</span>
            </div>
          </div>

          {/* 4 Feature Pills in Glassmorphism Card with Float Animation */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl space-y-3.5 animate-float">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">PNC-Registered Home Nursing</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Wound dressing, IV drip &amp; cannula, injections, and post-operative vital signs monitoring.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HeartPulse className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">PMDC Visiting Physicians</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  30–45 minute unhurried bedside clinical exam, electronic prescription &amp; lab review.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Bedside Blood &amp; Lab Tests</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Sealed single-use vacutainers, cold-chain transport, and verified digital PDF reports in 12–24h.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Permanent Digital Medical Records</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Access every past prescription, visit summary note, and pathology report from any phone anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Key Metric Indicators */}
        <div className="relative z-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <BadgeCheck className="h-4 w-4" />
              <span className="text-xs font-bold text-white">100% Verified</span>
            </div>
            <p className="text-2xs text-brand-200">PNC &amp; PMDC certified</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-amber-300 mb-1">
              <Star className="h-4 w-4 fill-amber-300" />
              <span className="text-xs font-bold text-white">4.9 / 5 Rating</span>
            </div>
            <p className="text-2xs text-brand-200">2,500+ happy families</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold text-white">Pay After Care</span>
            </div>
            <p className="text-2xs text-brand-200">Zero upfront deposit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
