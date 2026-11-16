import { Link } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Lock,
  MessageCircle,
  Phone,
  Sparkles,
  CheckCircle2,
  Clock,
  KeyRound,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useForgotPassword } from './useForgotPassword';

export function ForgotPassword(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError } = useForgotPassword();
  const { handleSubmit, formState, control } = form;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-brand-100 selection:text-brand-900">
      {/* ───── Left Column: Forgot Password Form ───── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-gradient-to-b from-ink-50/80 via-white to-brand-50/20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 animate-fade-in">
          <BrandLogo asLink to="/" size="md" subtitleText="PAKISTAN" />
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-600 hover:text-brand-700 transition-all px-3 py-1.5 rounded-xl hover:bg-ink-100/70 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign in</span>
          </Link>
        </div>

        {/* Centered Elevated Form Card */}
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl ring-1 ring-ink-100/80 hover:shadow-2xl transition-shadow duration-300">
            {/* Header info */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 text-2xs font-bold uppercase tracking-wider mb-3 animate-pulse-soft">
                <KeyRound className="h-3 w-3 text-brand-600" />
                <span>Account Recovery</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                Forgot password?
              </h1>
              <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
                Enter your registered phone number. We'll send a 6-digit verification code to your WhatsApp and SMS.
              </p>

              {/* 3 Step Visual Guide */}
              <div className="mt-4 pt-3 border-t border-ink-100 grid grid-cols-3 gap-2 text-2xs text-ink-500 text-center">
                <div className="p-2 rounded-xl bg-ink-50 border border-ink-100 transition-transform hover:scale-[1.02]">
                  <p className="font-bold text-ink-800">1. Phone</p>
                  <p className="text-[10px] text-ink-400">Enter number</p>
                </div>
                <div className="p-2 rounded-xl bg-ink-50 border border-ink-100 transition-transform hover:scale-[1.02]">
                  <p className="font-bold text-ink-800">2. OTP</p>
                  <p className="text-[10px] text-ink-400">Get 6 digits</p>
                </div>
                <div className="p-2 rounded-xl bg-ink-50 border border-ink-100 transition-transform hover:scale-[1.02]">
                  <p className="font-bold text-ink-800">3. Reset</p>
                  <p className="text-[10px] text-ink-400">Set password</p>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {serverError ? (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-xs text-danger-700 animate-slide-down flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>{serverError}</span>
              </div>
            ) : null}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    label="Registered phone number"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    autoComplete="tel-national"
                    error={formState.errors.phone?.message}
                  />
                )}
              />

              <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/60 text-xs text-ink-700 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  You will receive an official OTP from <span className="font-bold text-ink-900">HomeHealth</span>. The code will expire in 10 minutes.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isSubmitting}
                fullWidth
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl shadow-brand-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Send Verification Code
              </Button>
            </form>

            {/* Back to login */}
            <div className="mt-6 pt-5 border-t border-ink-100 text-center">
              <p className="text-xs sm:text-sm text-ink-600">
                Remembered your password?{' '}
                <Link
                  to="/auth/login"
                  className="font-bold text-brand-700 hover:text-brand-800 transition-colors underline underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Privacy note */}
            <div className="mt-5 pt-3 border-t border-ink-100/70 flex items-center justify-center gap-1.5 text-2xs text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>Multi-Factor Identity Protection · HomeHealth Pakistan</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
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
        <div className="relative z-10 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-md text-xs font-semibold text-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span>Automated 2-Way OTP Delivery Active</span>
          </span>
        </div>

        {/* Center content & Security Highlights Card */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Secure Healthcare Access,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white block sm:inline">
                Always In Your Control.
              </span>
            </h2>
            <p className="text-brand-100 text-sm sm:text-base leading-relaxed font-normal">
              Your patient and medical records are protected by multi-factor phone verification. Recover your access in seconds without hassle.
            </p>
          </div>

          {/* 3 Security Pillars in Glassmorphism Card with Float Animation */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl space-y-3.5 animate-float">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Instant WhatsApp &amp; SMS Dispatch</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Receive your 6-digit code within 30 seconds directly on your active phone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">HIPAA-Grade Record Protection</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Your clinical history, lab reports, and prescriptions remain strictly confidential.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">24/7 Clinical Care Desk Support</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  If your phone number has changed, contact our helpline at +92 300 1234567 for manual identity verification.
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
              <span className="text-xs font-bold text-white">100% Encrypted</span>
            </div>
            <p className="text-2xs text-brand-200">Argon2id &amp; RS256</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold text-white">&lt; 30s Delivery</span>
            </div>
            <p className="text-2xs text-brand-200">WhatsApp &amp; SMS OTP</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <Phone className="h-4 w-4" />
              <span className="text-xs font-bold text-white">24/7 Helpline</span>
            </div>
            <p className="text-2xs text-brand-200">+92 300 1234567</p>
          </div>
        </div>
      </div>
    </div>
  );
}
