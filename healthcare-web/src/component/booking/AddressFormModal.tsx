import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, MapPinned, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../constant/Button';
import { Input } from '../../constant/Input';
import { api, extractApiError } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import type { Address, CityWithZones } from '../../types/booking.types';
import { LocationPicker, type LocationPickerValue } from '../common/LocationPicker';

const AddressFormSchema = z.object({
  label: z.string().max(50).optional(),
  cityId: z.string().uuid({ message: 'Pick a city' }),
  zoneId: z.string().uuid().optional().or(z.literal('')),
  contactName: z.string().min(1, 'Contact name is required').max(150),
  contactPhone: z.string().min(7, 'Phone is required').max(20),
  line1: z.string().min(1, 'Street/house is required').max(255),
  line2: z.string().max(255).optional(),
  area: z.string().min(1, 'Area is required').max(120),
  postalCode: z.string().max(20).optional(),
});

type AddressFormValues = z.infer<typeof AddressFormSchema>;

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (address: Address) => void;
  defaultContactPhone?: string;
  defaultContactName?: string;
}

export function AddressFormModal({
  open,
  onClose,
  onCreated,
  defaultContactPhone,
  defaultContactName,
}: AddressFormModalProps): JSX.Element {
  const { register, handleSubmit, formState, watch, setValue, reset } = useForm<AddressFormValues>({
    resolver: zodResolver(AddressFormSchema),
    defaultValues: {
      label: '',
      cityId: '',
      zoneId: '',
      contactName: defaultContactName ?? '',
      contactPhone: defaultContactPhone ?? '',
      line1: '',
      line2: '',
      area: '',
      postalCode: '',
    },
  });

  const [cities, setCities] = useState<CityWithZones[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [location, setLocation] = useState<LocationPickerValue | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCityId = watch('cityId');
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === selectedCityId) ?? null,
    [cities, selectedCityId],
  );

  // Fetch cities on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setCitiesLoading(true);
    api
      .get<{ success: true; data: CityWithZones[] }>(API.CITIES)
      .then(({ data }) => {
        if (!cancelled) setCities(data.data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(extractApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset zone when city changes (zones are city-specific)
  useEffect(() => {
    setValue('zoneId', '');
  }, [selectedCityId, setValue]);

  const close = (): void => {
    reset();
    setLocation(null);
    onClose();
  };

  const onSubmit = async (values: AddressFormValues): Promise<void> => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        cityId: values.cityId,
        contactName: values.contactName.trim(),
        contactPhone: values.contactPhone.trim(),
        line1: values.line1.trim(),
        area: values.area.trim(),
      };
      if (values.zoneId) payload['zoneId'] = values.zoneId;
      if (values.label?.trim()) payload['label'] = values.label.trim();
      if (values.line2?.trim()) payload['line2'] = values.line2.trim();
      if (values.postalCode?.trim()) payload['postalCode'] = values.postalCode.trim();
      if (location) {
        payload['latitude'] = location.lat;
        payload['longitude'] = location.lng;
      }

      const { data } = await api.post<{ success: true; data: Address }>(API.USERS.ADDRESSES, payload);
      toast.success('Address saved');
      onCreated(data.data);
      reset();
      setLocation(null);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={close} className="relative z-50">
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
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-brand-soft">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
                      <MapPinned className="h-4 w-4" />
                    </div>
                    <div>
                      <Dialog.Title className="font-bold text-ink-900">Add a service address</Dialog.Title>
                      <p className="text-xs text-ink-600">
                        Where should our staff arrive for visits?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="p-2 rounded-lg text-ink-500 hover:bg-white/60"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit(onSubmit)();
                  }}
                  className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto"
                >
                  <Input
                    label="Label"
                    placeholder="e.g. Home, Mom's place, Clinic"
                    {...register('label')}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-ink-700">City *</label>
                      <select
                        {...register('cityId')}
                        disabled={citiesLoading}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white disabled:bg-ink-50"
                      >
                        <option value="">{citiesLoading ? 'Loading…' : 'Select a city'}</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {formState.errors.cityId?.message ? (
                        <p className="text-xs text-danger-700">{formState.errors.cityId.message}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-ink-700">
                        Zone <span className="text-ink-400 font-normal">(optional)</span>
                      </label>
                      <select
                        {...register('zoneId')}
                        disabled={!selectedCity || selectedCity.zones.length === 0}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white disabled:bg-ink-50"
                      >
                        <option value="">
                          {!selectedCity
                            ? 'Pick a city first'
                            : selectedCity.zones.length === 0
                              ? 'No zones for this city'
                              : 'Any zone'}
                        </option>
                        {selectedCity?.zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact name *"
                      placeholder="Who should staff ask for?"
                      error={formState.errors.contactName?.message}
                      {...register('contactName')}
                    />
                    <Input
                      label="Contact phone *"
                      placeholder="03xx-xxxxxxx"
                      error={formState.errors.contactPhone?.message}
                      {...register('contactPhone')}
                    />
                  </div>

                  <Input
                    label="Street / house no. *"
                    placeholder="House 12-B, Street 4"
                    error={formState.errors.line1?.message}
                    {...register('line1')}
                  />

                  <Input
                    label="Apartment / floor (optional)"
                    placeholder="Apartment 5, 3rd floor"
                    {...register('line2')}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Area / locality *"
                      placeholder="e.g. DHA Phase 5, Gulshan-e-Iqbal"
                      error={formState.errors.area?.message}
                      {...register('area')}
                    />
                    <Input
                      label="Postal code"
                      placeholder="75500"
                      {...register('postalCode')}
                    />
                  </div>

                  <div className="pt-2">
                    <label className="text-sm font-medium text-ink-700 mb-2 block">
                      Pin on map <span className="text-ink-400 font-normal">(optional, helps staff find you faster)</span>
                    </label>
                    <LocationPicker value={location} onChange={setLocation} />
                  </div>
                </form>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-100 bg-ink-50">
                  <Button variant="ghost" onClick={close} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleSubmit(onSubmit)()}
                    isLoading={submitting}
                    leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
                  >
                    Save address
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
