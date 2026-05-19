import { Link } from 'react-router-dom';
import { Heart, User, Phone, Mail, Lock } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { useRegister } from './useRegister';

export function Register(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError } = useRegister();
  const { register, handleSubmit, formState } = form;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh px-6 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-brand">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-ink-900 text-lg leading-tight">HomeHealth</p>
            <p className="text-xs text-ink-500">Create your account</p>
          </div>
        </Link>

        <div className="bg-white rounded-3xl shadow-card-hover ring-1 ring-ink-100 p-8 sm:p-10 animate-slide-up">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Create account</h1>
          <p className="text-ink-500 mt-2">Get verified care for your loved ones, in minutes.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <Input
              label="Full name"
              placeholder="Asma Khan"
              leftIcon={<User className="h-4 w-4" />}
              error={formState.errors.fullName?.message}
              {...register('fullName')}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Phone"
                type="tel"
                placeholder="+923001234567"
                leftIcon={<Phone className="h-4 w-4" />}
                error={formState.errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={formState.errors.email?.message}
                {...register('email')}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                error={formState.errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Re-enter"
                leftIcon={<Lock className="h-4 w-4" />}
                error={formState.errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            {serverError ? (
              <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
                {serverError}
              </div>
            ) : null}

            <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth className="mt-2">
              Create account
            </Button>
          </form>

          <p className="text-sm text-ink-500 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
