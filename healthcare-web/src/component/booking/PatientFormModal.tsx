import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../constant/Button';
import { Input } from '../../constant/Input';
import { api, extractApiError } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import type { Patient } from '../../types/booking.types';

const PatientFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  relationshipToCustomer: z.string().max(50).optional(),
  primaryCondition: z.string().optional(),
  allergies: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof PatientFormSchema>;

interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (patient: Patient) => void;
}

export function PatientFormModal({ open, onClose, onCreated }: PatientFormModalProps): JSX.Element {
  const { register, handleSubmit, formState, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(PatientFormSchema),
    defaultValues: { fullName: '', gender: '', dateOfBirth: '', relationshipToCustomer: '' },
  });
  const [submitting, setSubmitting] = useState(false);

  const close = (): void => {
    reset();
    onClose();
  };

  const onSubmit = async (values: PatientFormValues): Promise<void> => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { fullName: values.fullName.trim() };
      if (values.gender) payload['gender'] = values.gender;
      if (values.dateOfBirth) payload['dateOfBirth'] = values.dateOfBirth;
      if (values.relationshipToCustomer?.trim()) {
        payload['relationshipToCustomer'] = values.relationshipToCustomer.trim();
      }
      if (values.primaryCondition?.trim()) payload['primaryCondition'] = values.primaryCondition.trim();
      if (values.allergies?.trim()) payload['allergies'] = values.allergies.trim();
      if (values.notes?.trim()) payload['notes'] = values.notes.trim();

      const { data } = await api.post<{ success: true; data: Patient }>(API.USERS.PATIENTS, payload);
      toast.success(`${data.data.fullName} added`);
      onCreated(data.data);
      reset();
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
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-card-hover ring-1 ring-ink-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-brand-soft">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
                      <UserPlus className="h-4 w-4" />
                    </div>
                    <div>
                      <Dialog.Title className="font-bold text-ink-900">Add a patient</Dialog.Title>
                      <p className="text-xs text-ink-600">
                        The person who&apos;ll receive care (yourself or a family member)
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
                  className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                  <Input
                    label="Full name *"
                    placeholder="e.g. Amina Khan"
                    error={formState.errors.fullName?.message}
                    {...register('fullName')}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-ink-700">Gender</label>
                      <select
                        {...register('gender')}
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
                      >
                        <option value="">—</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <Input
                      label="Date of birth"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      {...register('dateOfBirth')}
                    />
                  </div>

                  <Input
                    label="Relationship to you"
                    placeholder="e.g. Mother, Father, Self, Child"
                    {...register('relationshipToCustomer')}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-700">
                      Primary condition <span className="text-ink-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Post-op recovery, diabetes, mobility issues"
                      {...register('primaryCondition')}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-700">
                      Allergies <span className="text-ink-400 font-normal">(optional)</span>
                    </label>
                    <Input placeholder="e.g. Penicillin, peanuts" {...register('allergies')} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink-700">
                      Notes for staff <span className="text-ink-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Anything the visiting staff should know"
                      {...register('notes')}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                    />
                  </div>
                </form>

                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-100 bg-ink-50">
                  <Button variant="ghost" onClick={close} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleSubmit(onSubmit)()}
                    isLoading={submitting}
                    leftIcon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  >
                    Save patient
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
