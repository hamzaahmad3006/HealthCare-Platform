import { Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { useResetPassword } from './useResetPassword';

export function ResetPassword(): JSX.Element {
  const c = useResetPassword();
  const { register, handleSubmit, formState } = c.form;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-brand-100 selection:text-brand-900">
      {/* ───── Left Column: Reset Password Form ───── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-gradient-to-b from-ink-50/80 via-white to-brand-50/20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 animate-fade-in">
          <BrandLogo asLink to="/" size="md" subtitleText="PAKISTAN" />
          <Link
            to="/auth/forgot-password"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-600 hover:text-brand-700 transition-all px-3 py-1.5 rounded-xl hover:bg-ink-100/70 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Change Phone</span>
          </Link>
        </div>

        {/* Centered Elevated Form Card */}
        <div className="w-full max-w-md mx-auto my-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl ring-1 ring-ink-100/80 hover:shadow-2xl transition-shadow duration-300">
            {/* Header info */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 text-2xs font-bold uppercase tracking-wider mb-3 animate-pulse-soft">
                <Sparkles className="h-3 w-3 text-brand-600" />
                <span>Final Verification Step</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                Set new password
              </h1>
              {c.phone ? (
                <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
                  Enter the 6-digit code sent to <span className="font-bold text-ink-800">{c.phone}</span> via WhatsApp &amp; SMS, then choose your new password.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-ink-500 mt-1.5 leading-relaxed">
                  Enter the 6-digit verification code we sent you, then choose your new password.
                </p>
              )}
            </div>

            {/* Error banner */}
            {c.serverError ? (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-danger-50 ring-1 ring-danger-500/20 text-xs text-danger-700 animate-slide-down flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>{c.serverError}</span>
              </div>
            ) : null}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit(c.onSubmit)();
              }}
              className="space-y-4"
              noValidate
            >
              <Input
                label="6-Digit Verification Code (OTP)"
                placeholder="123456"
                autoComplete="one-time-code"
                maxLength={6}
                leftIcon={<KeyRound className="h-4 w-4" />}
                error={formState.errors.otp?.message}
                {...register('otp')}
              />

              <Input
                label="New password"
                type={c.showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 chars"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={c.toggleShowNew}
                    className="pointer-events-auto p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
                    aria-label={c.showNew ? 'Hide password' : 'Show password'}
                  >
                    {c.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={formState.errors.newPassword?.message}
                {...register('newPassword')}
              />

              <Input
                label="Confirm new password"
                type={c.showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={c.toggleShowConfirm}
                    className="pointer-events-auto p-1 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors"
                    aria-label={c.showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {c.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={formState.errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {/* Resend OTP button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xs text-ink-500">Didn't receive the code?</span>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                >
                  Resend OTP code
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={c.isSubmitting}
                fullWidth
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl shadow-brand-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                Reset Password &amp; Sign in
              </Button>
            </form>

            {/* Back to sign in */}
            <div className="mt-6 pt-5 border-t border-ink-100 text-center">
              <p className="text-xs sm:text-sm text-ink-600">
                Cancel recovery?{' '}
                <Link
                  to="/auth/login"
                  className="font-bold text-brand-700 hover:text-brand-800 transition-colors underline underline-offset-4"
                >
                  Return to sign in
                </Link>
              </p>
            </div>

            {/* Privacy note */}
            <div className="mt-5 pt-3 border-t border-ink-100/70 flex items-center justify-center gap-1.5 text-2xs text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              <span>Identity Verified · Zero Unauthorized Access</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-2xs text-ink-400 mt-8">
          <p>&copy; {new Date().getFullYear()} HomeHealth Pakistan · 24/7 Helpline: +92 300 1234567</p>
        </div>
      </div>

      {/* ───── Right Column: Visual Security Showcase ───── */}
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
            <span>Identity Verified Session</span>
          </span>
        </div>

        {/* Center content & Security Highlights Card */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Security Best Practices for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white block sm:inline">
                Your Health Account.
              </span>
            </h2>
            <p className="text-brand-100 text-sm sm:text-base leading-relaxed font-normal">
              Choose a strong password with at least 8 characters. Do not share your password or one-time verification codes with anyone.
            </p>
          </div>

          {/* 3 Security Tips in Glassmorphism Card with Float Animation */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl space-y-3.5 animate-float">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Minimum 8 Characters</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Combine uppercase, lowercase letters, numbers, and symbols for maximum account protection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Immediate Session Revocation</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Updating your password will automatically sign out any old or unrecognized active browser sessions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Protected Health Information (PHI)</p>
                <p className="text-xs text-brand-200 mt-0.5">
                  Your family’s diagnostic lab PDFs and doctors’ notes are encrypted and isolated under your login.
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
              <span className="text-xs font-bold text-white">Encrypted</span>
            </div>
            <p className="text-2xs text-brand-200">Argon2id Hash</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold text-white">Instant Sign In</span>
            </div>
            <p className="text-2xs text-brand-200">Direct redirection</p>
          </div>

          <div className="hover:translate-y-[-2px] transition-transform">
            <div className="flex items-center gap-1 text-emerald-300 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold text-white">Protected</span>
            </div>
            <p className="text-2xs text-brand-200">HIPAA Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
