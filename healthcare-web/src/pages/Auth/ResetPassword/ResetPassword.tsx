import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { useResetPassword } from './useResetPassword';

export function ResetPassword(): JSX.Element {
  const c = useResetPassword();
  const { register, handleSubmit, formState } = c.form;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="bg-white rounded-3xl shadow-card ring-1 ring-ink-100 p-8 animate-slide-up">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Reset password</h1>
            {c.phone ? (
              <p className="text-ink-500 mt-2 text-sm leading-relaxed">
                Enter the 6-digit code sent to{' '}
                <span className="font-semibold text-ink-700">{c.phone}</span> via WhatsApp
                {' '}and email, then set a new password.
              </p>
            ) : (
              <p className="text-ink-500 mt-2 text-sm">
                Enter the 6-digit code we sent you, then set a new password.
              </p>
            )}
          </div>

          {c.serverError ? (
            <div className="mb-5 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
              {c.serverError}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(c.onSubmit)();
            }}
            className="space-y-4"
          >
            <Input
              label="Reset code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              autoComplete="one-time-code"
              error={formState.errors.otp?.message}
              {...register('otp')}
            />

            <Input
              label="New password"
              type={c.showNew ? 'text' : 'password'}
              autoComplete="new-password"
              error={formState.errors.newPassword?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={c.toggleShowNew}
                  className="text-ink-400 hover:text-ink-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {c.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('newPassword')}
            />

            <Input
              label="Confirm new password"
              type={c.showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              error={formState.errors.confirmPassword?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={c.toggleShowConfirm}
                  className="text-ink-400 hover:text-ink-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {c.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('confirmPassword')}
            />

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={c.isSubmitting}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Reset password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
