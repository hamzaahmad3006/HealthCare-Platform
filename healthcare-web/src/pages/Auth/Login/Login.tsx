import { Link } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import {
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
  Quote,
  Check,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useLogin } from './useLogin';

export function Login(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError, showPassword, toggleShowPassword } = useLogin();
  const { register, handleSubmit, formState, control } = form;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-brand-100 selection:text-brand-900">
      {/* ───── Left Column: Authentication Form ───── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-gradient-to-b from-ink-50/80 via-white to-brand-50/20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 animate-fade-in">
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
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl ring-1 ring-ink-100/80 hover:shadow-2xl transition-shadow duration-300">
            {/* Header info */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 text-2xs font-bold uppercase tracking-wider mb-3 animate-pulse-soft">
                <Sparkles className="h-3 w-3 text-brand-600" />
                <span>Single Secure Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
                Sign in to manage your appointments, health records &amp; verified home care.
              </p>

              {/* Portal Roles Pill Bar */}
              <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-2xs text-ink-500">
                <span className="font-semibold text-ink-700">Access for:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Patients
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Staff
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Admin
                  </span>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    showCounter
                    error={formState.errors.phone?.message}
                  />
                )}
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={toggleShowPassword}
                      className="pointer-events-auto p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  error={formState.errors.password?.message}
                  {...register('password')}
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {serverError ? (
                <div className="px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-xs text-danger-700 animate-slide-down flex items-start gap-2">
                  <span className="font-bold">•</span>
                  <span>{serverError}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                fullWidth
                rightIcon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl shadow-brand-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Sign in to Account
              </Button>
            </form>

            {/* Registration link */}
            <div className="mt-6 pt-5 border-t border-ink-100 text-center">
              <p className="text-xs sm:text-sm text-ink-600">
                New to HomeHealth?{' '}
                <Link
                  to="/auth/register"
                  className="font-bold text-brand-700 hover:text-brand-800 transition-colors underline underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* Privacy & Security reassurance chip */}
            <div className="mt-5 pt-3 border-t border-ink-100/70 flex items-center justify-center gap-1.5 text-2xs text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>256-Bit SSL Encrypted · HIPAA-Grade Data Privacy</span>
            </div>
          </div>
        </div>

        {/* Bottom subtle copyright */}
        <div className="text-center text-2xs text-ink-400 mt-8">
          <p>&copy; {new Date().getFullYear()} HomeHealth Pakistan · Need urgent home care? Call +92 300 1234567</p>
        </div>
      </div>

      {/* ───── Right Column: Visual Clinical Proof & Showcase ───── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-teal-950 text-white p-12 xl:p-16 flex-col justify-between">
        {/* Soft background ambient blurs with smooth floating animation */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-80 w-80 rounded-full bg-teal-400/15 blur-3xl pointer-events-none animate-float-reverse" />

        {/* Top active status pill */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-xs font-semibold text-emerald-200 shadow-sm animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Live Dispatch Active · Faisalabad &amp; Punjab</span>
          </span>

          <span className="text-2xs font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm hidden xl:inline">
            Verified Healthcare
          </span>
        </div>

        {/* Center content & clinical dispatch card */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Hospital-Grade Healthcare,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white block sm:inline">
                Right At Your Doorstep.
              </span>
            </h2>
            <p className="text-brand-100 text-sm sm:text-base leading-relaxed font-normal">
              Verified doctors, registered nurses, and accredited diagnostic blood tests delivered directly to your
              family with zero advance payment.
            </p>
          </div>

          {/* Floating Arrival Notification Badge */}
          <div className="flex justify-end -mb-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 text-2xs font-semibold text-white shadow-lg animate-float-reverse">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>HMS-FSD-0082 · Confirmed · Visit in 45m</span>
            </div>
          </div>

          {/* Interactive Clinical Specialist Preview Card with Float Animation */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl space-y-4 animate-float">
            <div className="flex items-start gap-3.5">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-brand">
                  SA
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-brand-900">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-white text-base truncate">Dr. Sara Ahmed, MBBS, FCPS</p>
                  <BadgeCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                </div>
                <p className="text-xs text-brand-200 mt-0.5">Visiting Physician · PMDC #89432-P</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-brand-200">
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> 4.95 (380+ visits)
                  </span>
                  <span>·</span>
                  <span className="text-emerald-300 font-medium">On-Duty</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-2xs text-brand-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span>Sterile Kit Included</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span>Digital Prescription</span>
              </div>
            </div>

            {/* Patient review quote */}
            <div className="pt-3 border-t border-white/10 flex items-start gap-2.5 text-xs text-brand-100 italic bg-white/5 rounded-2xl p-3">
              <Quote className="h-4 w-4 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="leading-relaxed">
                  &ldquo;The nurse arrived in 40 minutes with sealed single-use supplies. Professional, gentle, and
                  transparent pricing.&rdquo;
                </p>
                <p className="not-italic text-2xs font-semibold text-white mt-1">
                  — Hassan A., Peoples Colony No. 1
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
              <span className="text-xs font-bold text-white">&lt; 60m Arrival</span>
            </div>
            <p className="text-2xs text-brand-200">Doorstep rapid dispatch</p>
          </div>
        </div>
      </div>
    </div>
  );
}
