import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { Card } from '../../../constant/Card';
import { Input } from '../../../constant/Input';
import { Button } from '../../../constant/Button';
import { useChangePassword } from './useChangePassword';

export function ChangePassword(): JSX.Element {
  const c = useChangePassword();
  const { register, handleSubmit, formState } = c.form;

  return (
    <SidebarLayout title="Change Password" description="Update your account password">
      <div className="max-w-md">
        <Card padding="md">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Update your password</p>
              <p className="text-xs text-ink-500 mt-0.5">You will be signed out after saving</p>
            </div>
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
              label="Current password"
              type={c.showOld ? 'text' : 'password'}
              autoComplete="current-password"
              error={formState.errors.oldPassword?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={c.toggleShowOld}
                  className="text-ink-400 hover:text-ink-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {c.showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('oldPassword')}
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
                fullWidth
                isLoading={c.isSubmitting}
                leftIcon={<ShieldCheck className="h-4 w-4" />}
              >
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </SidebarLayout>
  );
}
