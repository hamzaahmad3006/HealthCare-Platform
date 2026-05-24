import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Phone, Lock, Save, KeyRound, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { Card } from '../../../constant/Card';
import { TopNav } from '../../../component/common/TopNav';
import { useAccount } from './useAccount';
import { useAddresses, type AddressFormData } from './useAddresses';
import type { Address, CityWithZones } from '../../../types/booking.types';

export function Account(): JSX.Element {
  const a = useAccount();
  const addr = useAddresses();
  const { register: regProfile, handleSubmit: submitProfile, formState: pfState } = a.profileForm;
  const { register: regPwd, handleSubmit: submitPwd, formState: pwState } = a.passwordForm;

  return (
    <div className="min-h-screen bg-ink-50">
      <TopNav />

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Account settings</h1>
          <p className="text-ink-500 mt-1">Manage your profile and password.</p>
        </div>

        {/* ── Profile ── */}
        <Card variant="elevated" padding="lg" className="mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-bold text-lg">
              {a.user?.fullName?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Profile</h2>
              <p className="text-xs text-ink-500">Your name and email address</p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void submitProfile(a.onSaveProfile)(); }}
            className="space-y-4"
          >
            <Input
              label="Full name"
              leftIcon={<User className="h-4 w-4" />}
              error={pfState.errors.fullName?.message}
              {...regProfile('fullName')}
            />

            {/* Email — read-only, changing it needs email verification */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">Email address</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-sm text-ink-500">
                <Mail className="h-4 w-4 text-ink-400 flex-shrink-0" />
                <span>{a.user?.email ?? '—'}</span>
                <span className="ml-auto text-xs text-ink-400">Cannot be changed</span>
              </div>
            </div>

            {/* Phone — read-only, changing it needs OTP verification */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-700">Phone number</label>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-sm text-ink-500">
                <Phone className="h-4 w-4 text-ink-400 flex-shrink-0" />
                <span>{a.user?.phone ?? '—'}</span>
                <span className="ml-auto text-xs text-ink-400">Cannot be changed</span>
              </div>
            </div>

            {a.profileError ? (
              <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
                {a.profileError}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={a.isSavingProfile}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Saved Addresses ── */}
        <Card variant="elevated" padding="lg" className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink-900">Saved addresses</h2>
                <p className="text-xs text-ink-500">Home, clinic, or delivery locations</p>
              </div>
            </div>
            <Button size="sm" onClick={addr.openAdd} leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add
            </Button>
          </div>

          {addr.isLoading ? (
            <p className="text-sm text-ink-400 py-2">Loading…</p>
          ) : addr.addresses.length === 0 ? (
            <p className="text-sm text-ink-400 py-2 text-center">No addresses saved yet.</p>
          ) : (
            <div className="space-y-3">
              {addr.addresses.map((address) => (
                <div key={address.id} className="flex items-start justify-between gap-3 p-3 rounded-xl ring-1 ring-ink-100 bg-ink-50/50">
                  <div className="text-sm min-w-0">
                    {address.label && <p className="font-semibold text-ink-800 mb-0.5">{address.label}</p>}
                    <p className="text-ink-700">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                    <p className="text-ink-500 text-xs">{address.area} · {address.contactPhone}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => addr.openEdit(address)}
                      className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void addr.handleDelete(address.id)}
                      disabled={addr.deleting === address.id}
                      className="p-1.5 rounded-lg hover:bg-danger-50 text-ink-500 hover:text-danger-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Change Password ── */}
        <Card variant="elevated" padding="lg" className="animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-ink-100 text-ink-600 flex items-center justify-center">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink-900">Change password</h2>
              <p className="text-xs text-ink-500">Choose a strong password with at least 8 characters</p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void submitPwd(a.onChangePassword)(); }}
            className="space-y-4"
          >
            <Input
              label="Current password"
              type={a.showOld ? 'text' : 'password'}
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={a.toggleShowOld} className="pointer-events-auto p-1 rounded hover:bg-ink-100">
                  {a.showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={pwState.errors.oldPassword?.message}
              {...regPwd('oldPassword')}
            />

            <Input
              label="New password"
              type={a.showNew ? 'text' : 'password'}
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={a.toggleShowNew} className="pointer-events-auto p-1 rounded hover:bg-ink-100">
                  {a.showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={pwState.errors.newPassword?.message}
              {...regPwd('newPassword')}
            />

            <Input
              label="Confirm new password"
              type={a.showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={a.toggleShowConfirm} className="pointer-events-auto p-1 rounded hover:bg-ink-100">
                  {a.showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={pwState.errors.confirmPassword?.message}
              {...regPwd('confirmPassword')}
            />

            {a.passwordError ? (
              <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
                {a.passwordError}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                isLoading={a.isChangingPassword}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Update password
              </Button>
            </div>
          </form>
        </Card>
      </main>

      {addr.modalOpen && (
        <AddressModal
          address={addr.editing}
          cities={addr.cities}
          saving={addr.saving}
          onSave={addr.handleSave}
          onClose={addr.closeModal}
        />
      )}
    </div>
  );
}

function AddressModal({
  address, cities, saving, onSave, onClose,
}: {
  address: Address | null;
  cities: CityWithZones[];
  saving: boolean;
  onSave: (data: AddressFormData) => Promise<void>;
  onClose: () => void;
}): JSX.Element {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>();

  useEffect(() => {
    if (address) {
      reset({
        label: address.label ?? '',
        contactName: address.contactName,
        contactPhone: address.contactPhone,
        line1: address.line1,
        line2: address.line2 ?? '',
        area: address.area,
        cityId: address.cityId,
        postalCode: address.postalCode ?? '',
      });
    } else {
      reset({ cityId: cities[0]?.id ?? '' });
    }
  }, [address, cities, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-ink-100 overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink-100">
          <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-ink-900">
            {address ? 'Edit address' : 'Add address'}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit((data) => void onSave(data))}
          className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <Input label="Label (optional)" {...register('label')} placeholder="e.g. Home, Clinic" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact name *" {...register('contactName', { required: true })} error={errors.contactName && 'Required'} />
            <Input label="Contact phone *" {...register('contactPhone', { required: true })} placeholder="+92..." error={errors.contactPhone && 'Required'} />
          </div>

          <Input label="Address line 1 *" {...register('line1', { required: true })} placeholder="Street / house no." error={errors.line1 && 'Required'} />
          <Input label="Address line 2" {...register('line2')} placeholder="Apartment, floor (optional)" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Area *" {...register('area', { required: true })} placeholder="e.g. Gulberg" error={errors.area && 'Required'} />
            <Input label="Postal code" {...register('postalCode')} placeholder="e.g. 38000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">City *</label>
            <select
              {...register('cityId', { required: true })}
              className="w-full h-10 px-3 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </form>

        <div className="flex gap-3 px-6 py-4 border-t border-ink-100 bg-ink-50/50">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={saving}>Cancel</Button>
          <Button fullWidth loading={saving} onClick={handleSubmit((data) => void onSave(data))}>
            {address ? 'Save changes' : 'Add address'}
          </Button>
        </div>
      </div>
    </div>
  );
}
