import React from 'react';
import { Controller } from 'react-hook-form';
import { CheckCircle2, CreditCard, MapPin, Briefcase, Siren } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { useCompleteProfile } from './useCompleteProfile';

const GENDERS: Array<{ id: 'MALE' | 'FEMALE' | 'OTHER'; label: string }> = [
  { id: 'MALE', label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
  { id: 'OTHER', label: 'Other' },
];

export function CompleteProfile(): JSX.Element {
  const c = useCompleteProfile();
  const { register, handleSubmit, formState, control } = c.form;

  if (c.isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading your profile…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Brand header */}
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/assets/logo-icon.jpg" alt="" aria-hidden className="h-10 w-10 object-contain" />
          <div>
            <p className="font-bold text-ink-900 leading-tight">HomeHealth</p>
            <p className="text-2xs text-ink-500">Staff onboarding</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card ring-1 ring-ink-100 p-8 sm:p-10 animate-slide-up">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
            Welcome, {c.me?.user.fullName.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-ink-600 mt-2 leading-relaxed">
            Complete your profile so admin can verify you and start sending assignments. Your
            staff code is{' '}
            <span className="font-mono text-brand-700">{c.me?.staffCode}</span>.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(c.onSubmit)();
            }}
            className="mt-8 space-y-5"
          >
            <SectionHeader icon={<CreditCard className="h-4 w-4" />} title="Identity" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="CNIC *"
                placeholder="35201-1234567-1"
                error={formState.errors.cnic?.message}
                {...register('cnic')}
              />
              <Input
                label="Date of birth"
                type="date"
                error={formState.errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>

            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <div>
                  <label className="text-sm font-medium text-ink-700 block mb-2">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map((g) => {
                      const active = field.value === g.id;
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => field.onChange(g.id)}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl ring-1 transition-all ${
                            active
                              ? 'bg-brand-600 text-white ring-brand-700 shadow-brand'
                              : 'bg-white text-ink-700 ring-ink-200 hover:ring-brand-300'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            />

            <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Location" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="City *" error={formState.errors.cityId?.message} {...register('cityId')}>
                <option value="">— Select city —</option>
                {c.cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Zone"
                disabled={c.zonesForSelectedCity.length === 0}
                error={formState.errors.zoneId?.message}
                {...register('zoneId')}
              >
                <option value="">— Select zone —</option>
                {c.zonesForSelectedCity.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </Select>
              {c.form.watch('cityId') && c.zonesForSelectedCity.length === 0 ? (
                <p className="text-xs text-ink-500">
                  No active zones are configured for this city yet. Please contact admin or select a different city.
                </p>
              ) : null}
            </div>

            <SectionHeader icon={<Briefcase className="h-4 w-4" />} title="Experience &amp; services" />
            <Input
              label="Years of experience"
              type="number"
              min={0}
              max={60}
              error={formState.errors.experienceYears?.message}
              {...register('experienceYears')}
            />

            <div>
              <label className="text-sm font-medium text-ink-700 block mb-2">
                Services you can deliver *
              </label>
              <div className="flex flex-wrap gap-2">
                {c.services.map((svc) => {
                  const active = c.selectedServiceIds.includes(svc.id);
                  return (
                    <button
                      type="button"
                      key={svc.id}
                      onClick={() => c.toggleService(svc.id)}
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
              {formState.errors.serviceTypeIds ? (
                <p className="text-xs font-medium text-danger-700 mt-2">
                  {formState.errors.serviceTypeIds.message}
                </p>
              ) : null}
            </div>

            {c.needsAmbulanceNumber ? (
              <div className="rounded-xl bg-accent-50 ring-1 ring-accent-200 px-4 py-4 animate-slide-down">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center flex-shrink-0">
                    <Siren className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Ambulance number *"
                      placeholder="FSD-1234 or LE-ABC-123"
                      helperText="Vehicle registration plate. Required for ambulance service."
                      error={formState.errors.ambulanceNumber?.message}
                      {...register('ambulanceNumber')}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-xl bg-brand-50 ring-1 ring-brand-200/60 px-4 py-3 text-xs text-brand-800 leading-relaxed">
              <strong>Next step after saving:</strong> upload your CNIC scan and any certifications.
              Admin will review and verify — once verified you can start accepting visits.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                size="lg"
                isLoading={c.isSubmitting}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              >
                Save profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: JSX.Element; title: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-ink-100">
      <span className="text-brand-700">{icon}</span>
      <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
    </div>
  );
}

// Native select styled to match Input.
// Must use forwardRef so react-hook-form's register() ref reaches the <select>.
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
>(({ label, error, children, disabled, ...rest }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label ? <label className="text-sm font-medium text-ink-700">{label}</label> : null}
    <select
      {...rest}
      ref={ref}
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
));
Select.displayName = 'Select';
