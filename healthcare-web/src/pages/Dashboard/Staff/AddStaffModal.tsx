import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Controller } from 'react-hook-form';
import { X, UserPlus, CheckCircle2, Copy, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { useCreateStaff, type CreateStaffSuccess } from './useCreateStaff';

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps): JSX.Element {
  const c = useCreateStaff();
  const { register, handleSubmit, formState, control } = c.form;

  const handleClose = (): void => {
    if (c.result) {
      onCreated();
      c.resetResult();
    }
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-card-hover ring-1 ring-ink-100 overflow-hidden">
                {c.result ? (
                  <SuccessView result={c.result} onClose={handleClose} />
                ) : (
                  <>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-brand-soft">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
                          <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                          <Dialog.Title className="font-bold text-ink-900">Invite new staff</Dialog.Title>
                          <p className="text-xs text-ink-600">
                            They&apos;ll complete their own profile after signing in
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-ink-500 hover:bg-white/60"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit(c.onSubmit)();
                      }}
                      className="px-6 py-5 space-y-4"
                    >
                      <Input
                        label="Full name *"
                        placeholder="Sarah Khan"
                        error={formState.errors.fullName?.message}
                        {...register('fullName')}
                      />

                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                          <PhoneInput
                            label="Phone *"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            helperText="Used for login + WhatsApp invite"
                            error={formState.errors.phone?.message}
                          />
                        )}
                      />

                      <Input
                        label="Email *"
                        type="email"
                        placeholder="sarah@example.com"
                        helperText="Invite link with temp password is sent here"
                        error={formState.errors.email?.message}
                        {...register('email')}
                      />

                      <div className="rounded-xl bg-brand-50 ring-1 ring-brand-200/60 px-4 py-3 text-xs text-brand-800 leading-relaxed">
                        <strong>What happens next:</strong> we email them a temp password +
                        a login link. After first login they fill their CNIC, city, services,
                        and upload verification documents. You then review and approve.
                      </div>
                    </form>

                    <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-100 bg-ink-50">
                      <Button variant="ghost" onClick={onClose} disabled={c.isSubmitting}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleSubmit(c.onSubmit)()}
                        isLoading={c.isSubmitting}
                        leftIcon={<UserPlus className="h-4 w-4" />}
                      >
                        Send invite
                      </Button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ─── Success view ───────────────────────────────────────────────────────────

function SuccessView({
  result,
  onClose,
}: {
  result: CreateStaffSuccess;
  onClose: () => void;
}): JSX.Element {
  const copyPassword = async (): Promise<void> => {
    await navigator.clipboard.writeText(result.tempPassword);
    toast.success('Password copied to clipboard');
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-xl bg-success-50 text-success-700 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <Dialog.Title className="font-bold text-ink-900 text-lg">Invite sent</Dialog.Title>
          <p className="text-sm text-ink-600">
            {result.fullName} · {result.staffCode}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-ink-50 ring-1 ring-ink-100 p-4 mb-4">
        <p className="text-2xs font-mono uppercase tracking-wider text-ink-500 mb-1.5">
          Temporary password
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-ink-900 bg-white rounded-lg ring-1 ring-ink-200 px-3 py-2 text-sm break-all">
            {result.tempPassword}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copyPassword()}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Shown once. The staff will be prompted to change it on first login.
        </p>
      </div>

      <div className="space-y-2 mb-5">
        <DeliveryRow
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          target={result.phone}
          delivered={result.delivery.whatsapp}
        />
        <DeliveryRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          target={result.email ?? '—'}
          delivered={result.delivery.email}
        />
      </div>

      {!result.delivery.whatsapp && !result.delivery.email ? (
        <div className="flex items-start gap-2 rounded-xl bg-warning-50 ring-1 ring-warning-500/20 px-4 py-3 mb-5">
          <AlertTriangle className="h-4 w-4 text-warning-700 mt-0.5" />
          <div className="text-xs text-warning-700 leading-relaxed">
            <strong>No automated delivery succeeded.</strong> Copy the password above and share
            it with the staff member manually.
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

function DeliveryRow({
  icon,
  label,
  target,
  delivered,
}: {
  icon: JSX.Element;
  label: string;
  target: string;
  delivered: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg ring-1 ring-ink-100 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-ink-700 min-w-0">
        <span className="text-ink-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-ink-500 truncate">— {target}</span>
      </div>
      {delivered ? (
        <span className="text-xs font-semibold text-success-700 inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sent
        </span>
      ) : (
        <span className="text-xs font-semibold text-warning-700">Failed</span>
      )}
    </div>
  );
}
