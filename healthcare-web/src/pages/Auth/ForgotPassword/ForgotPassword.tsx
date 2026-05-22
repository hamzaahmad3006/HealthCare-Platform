import { Link } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { useForgotPassword } from './useForgotPassword';

export function ForgotPassword(): JSX.Element {
  const { form, onSubmit, isSubmitting, serverError } = useForgotPassword();
  const { handleSubmit, formState, control } = form;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="bg-white rounded-3xl shadow-card ring-1 ring-ink-100 p-8 animate-slide-up">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Forgot password?</h1>
            <p className="text-ink-500 mt-2 text-sm leading-relaxed">
              Enter your registered phone number. We'll send a 6-digit reset code to your
              WhatsApp and email.
            </p>
          </div>

          {serverError ? (
            <div className="mb-5 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
              {serverError}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)();
            }}
            className="space-y-5"
          >
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

            <Button
              type="submit"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Send reset code
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
