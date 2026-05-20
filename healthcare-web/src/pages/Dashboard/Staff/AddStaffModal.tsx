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
  const c = useCreateStaff(open);
  const { register, handleSubmit, formState, setValue, watch, control } = c.form;

  const selectedServiceIds = watch('serviceTypeIds') ?? [];

  const toggleService = (id: string): void => {
    const next = selectedServiceIds.includes(id)
      ? selectedServiceIds.filter((s) => s !== id)
      : [...selectedServiceIds, id];
    setValue('serviceTypeIds', next, { shouldValidate: true });
  };

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
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-card-hover ring-1 ring-ink-100 overflow-hidden">
                {c.result ? (
                  <SuccessView result={c.result} onClose={handleClose} />
                ) : (
                  <FormView
                    register={register}
                    control={control}
                    formState={formState}
                    handleSubmit={handleSubmit(c.onSubmit)}
                    services={c.services}
                    cities={c.cities}
                    zones={c.zonesForSelectedCity}
                    selectedServiceIds={selectedServiceIds}
                    toggleService={toggleService}
                    isSubmitting={c.isSubmitting}
                    isLoadingOptions={c.isLoadingOptions}
                    onClose={onClose}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ─── Form view ──────────────────────────────────────────────────────────────

interface FormViewProps {
  register: ReturnType<typeof useCreateStaff>['form']['register'];
  control: ReturnType<typeof useCreateStaff>['form']['control'];
  formState: ReturnType<typeof useCreateStaff>['form']['formState'];
  handleSubmit: () => void;
  services: Array<{ id: string; code: string; name: string }>;
  cities: Array<{ id: string; name: string; zones?: Array<{ id: string; name: string }> }>;
  zones: Array<{ id: string; name: string }>;
  selectedServiceIds: string[];
  toggleService: (id: string) => void;
  isSubmitting: boolean;
  isLoadingOptions: boolean;
  onClose: () => void;
}

function FormView({
  register,
  control,
  formState,
  handleSubmit,
  services,
  cities,
  zones,
  selectedServiceIds,
  toggleService,
  isSubmitting,
  isLoadingOptions,
  onClose,
}: FormViewProps): JSX.Element {
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-brand-soft">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <Dialog.Title className="font-bold text-ink-900">Onboard new staff</Dialog.Title>
            <p className="text-xs text-ink-600">Invite sent to phone (WhatsApp) and email automatically</p>
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

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          label="Full name *"
          placeholder="Sarah Khan"
          error={formState.errors.fullName?.message}
          {...register('fullName')}
        />

        <div className="grid sm:grid-cols-2 gap-4">
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
                error={formState.errors.phone?.message}
              />
            )}
          />
          <Input
            label="Email (optional)"
            type="email"
            placeholder="sarah@example.com"
            error={formState.errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="CNIC *"
            placeholder="35201-1234567-1"
            error={formState.errors.cnic?.message}
            {...register('cnic')}
          />
          <Input
            label="Experience (years)"
            type="number"
            min={0}
            max={60}
            error={formState.errors.experienceYears?.message}
            {...register('experienceYears')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="Gender"
            error={formState.errors.gender?.message}
            {...register('gender')}
          >
            <option value="">— Select —</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input
            label="Date of birth"
            type="date"
            error={formState.errors.dateOfBirth?.message}
            {...register('dateOfBirth')}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label="City *"
            disabled={isLoadingOptions}
            error={formState.errors.cityId?.message}
            {...register('cityId')}
          >
            <option value="">— Select city —</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
          <Select
            label="Zone"
            disabled={zones.length === 0}
            error={formState.errors.zoneId?.message}
            {...register('zoneId')}
          >
            <option value="">— Select zone —</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 block mb-2">
            Services this staff can deliver *
          </label>
          {isLoadingOptions ? (
            <div className="text-xs text-ink-500 py-3">Loading services…</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map((svc) => {
                const active = selectedServiceIds.includes(svc.id);
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg ring-1 transition-all ${
                      active
                        ? 'bg-brand-600 text-white ring-brand-700 shadow-brand'
                        : 'bg-white text-ink-700 ring-ink-200 hover:ring-brand-300'
                    }`}
                  >
                    {svc.name}
                  </button>
                );
              })}
            </div>
          )}
          {formState.errors.serviceTypeIds ? (
            <p className="text-xs font-medium text-danger-700 mt-2">
              {formState.errors.serviceTypeIds.message}
            </p>
          ) : null}
        </div>
      </form>

      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-100 bg-ink-50">
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting} leftIcon={<UserPlus className="h-4 w-4" />}>
          Create &amp; send invite
        </Button>
      </div>
    </>
  );
}

// ─── Native <select> styled to match Input ──────────────────────────────────

const Select = (
  { label, error, children, disabled, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
  } & React.RefAttributes<HTMLSelectElement>,
): JSX.Element => (
  <div className="flex flex-col gap-1.5">
    {label ? <label className="text-sm font-medium text-ink-700">{label}</label> : null}
    <select
      {...props}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={`w-full bg-white text-ink-900 rounded-xl border px-4 py-2.5 text-sm transition-all
        ${error
          ? 'border-danger-500 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
          : 'border-ink-200 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'}
        disabled:bg-ink-50 disabled:cursor-not-allowed outline-none`}
    >
      {children}
    </select>
    {error ? <p className="text-xs font-medium text-danger-700">{error}</p> : null}
  </div>
);

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
          <Dialog.Title className="font-bold text-ink-900 text-lg">Staff onboarded</Dialog.Title>
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
          Staff must change this on first login. It is shown only once — save it now if delivery
          channels below failed.
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
          target={result.email ?? 'No email on file'}
          delivered={result.delivery.email}
          skipped={!result.email}
        />
      </div>

      {!result.delivery.whatsapp && !result.delivery.email ? (
        <div className="flex items-start gap-2 rounded-xl bg-warning-50 ring-1 ring-warning-500/20 px-4 py-3 mb-5">
          <AlertTriangle className="h-4 w-4 text-warning-700 mt-0.5" />
          <div className="text-xs text-warning-700 leading-relaxed">
            <strong>No automated delivery succeeded.</strong> Copy the password above and share it
            with the staff member manually (WhatsApp, SMS, or in-person).
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
  skipped = false,
}: {
  icon: JSX.Element;
  label: string;
  target: string;
  delivered: boolean;
  skipped?: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg ring-1 ring-ink-100 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-ink-700 min-w-0">
        <span className="text-ink-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-ink-500 truncate">— {target}</span>
      </div>
      {skipped ? (
        <span className="text-xs font-semibold text-ink-400">Skipped</span>
      ) : delivered ? (
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
