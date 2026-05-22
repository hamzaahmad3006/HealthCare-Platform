import { Link } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import { Lock, Eye, EyeOff, ShieldCheck, BadgeCheck, Star } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { useLogin } from './useLogin';

export function Login(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError, showPassword, toggleShowPassword } = useLogin();
  const { register, handleSubmit, formState, control } = form;

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10">
            <img
              src="/assets/logo-icon.jpg"
              alt=""
              aria-hidden
              className="h-11 w-11 object-contain"
            />
            <div>
              <p className="font-bold text-ink-900 text-lg leading-tight">HomeHealth</p>
              <p className="text-xs text-ink-500">Healthcare at your doorstep</p>
            </div>
          </Link>

          <div className="mb-8 animate-slide-up">
            <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Welcome back</h1>
            <p className="text-ink-500 mt-2">Sign in to manage your bookings and care.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-slide-up" noValidate>
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
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="pointer-events-auto p-1 rounded hover:bg-ink-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={formState.errors.password?.message}
              {...register('password')}
            />

            {serverError ? (
              <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 animate-slide-down">
                {serverError}
              </div>
            ) : null}

            <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth>
              Sign in
            </Button>
          </form>

          <p className="text-sm text-ink-500 mt-8 text-center">
            New to HomeHealth?{' '}
            <Link to="/auth/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Right — hero/branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute inset-0 flex flex-col justify-center px-16 text-white">
          <div className="max-w-lg animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm text-xs font-semibold mb-6">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified · Trusted · Trained
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
              Quality healthcare, delivered to your home.
            </h2>
            <p className="text-brand-100 mt-5 text-lg leading-relaxed">
              Trusted by hundreds of families across Faisalabad for nursing, physiotherapy, lab sampling, and visiting
              doctors.
            </p>

            <div className="grid grid-cols-3 gap-6 mt-12">
              <Stat icon={<BadgeCheck className="h-5 w-5" />} value="100%" label="Verified staff" />
              <Stat icon={<Star className="h-5 w-5" fill="currentColor" />} value="4.8" label="Average rating" />
              <Stat icon={<ShieldCheck className="h-5 w-5" />} value="HIPAA-grade" label="Data privacy" />
            </div>
          </div>
        </div>
        {/* Floating cards (decorative) */}
        <div className="absolute top-10 right-10 w-48 p-4 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl rotate-3 animate-fade-in hidden xl:block">
          <p className="text-white/70 text-xs font-mono">HHS-FSD-000234</p>
          <p className="text-white font-semibold mt-1">Booking Confirmed</p>
          <p className="text-brand-200 text-xs mt-1">Visit in 60 minutes</p>
        </div>
        <div className="absolute bottom-16 right-20 w-56 p-4 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl -rotate-2 animate-fade-in hidden xl:block">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white font-bold">
              SK
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Sarah Khan, RN</p>
              <p className="text-brand-200 text-xs">En route now · 8 min away</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: JSX.Element; value: string; label: string }): JSX.Element {
  return (
    <div>
      <div className="text-brand-300 mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-brand-200 mt-1">{label}</p>
    </div>
  );
}
