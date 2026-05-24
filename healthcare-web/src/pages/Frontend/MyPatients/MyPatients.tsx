import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, Pencil, Trash2, User, Calendar, Heart, AlertCircle } from 'lucide-react';
import { TopNav } from '../../../component/common/TopNav';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { Card } from '../../../constant/Card';
import { Pagination } from '../../../component/common/Pagination';
import { EmptyState } from '../../../component/common/EmptyState';
import { Skeleton } from '../../../component/common/Skeleton';
import { useMyPatients } from './useMyPatients';
import type { Patient, PatientFormData } from '../../../types/patient.types';

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

const RELATIONSHIPS = ['Self', 'Spouse', 'Son', 'Daughter', 'Mother', 'Father', 'Sibling', 'Other'];

function calcAge(dob: string | null): string {
  if (!dob) return '';
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

export function MyPatients(): JSX.Element {
  const p = useMyPatients();

  return (
    <div className="min-h-screen bg-ink-50">
      <TopNav />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-up">
          <div>
            <h1 className="text-3xl font-bold text-ink-900 tracking-tight">My patients</h1>
            <p className="text-ink-500 mt-1">Manage family members for bookings.</p>
          </div>
          <Button onClick={p.openAdd} leftIcon={<Plus className="h-4 w-4" />}>
            Add patient
          </Button>
        </div>

        {/* Error */}
        {p.error ? (
          <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
            {p.error}
          </div>
        ) : null}

        {/* List */}
        {p.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : p.patients.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No patients yet"
            description="Add a family member to book services for them."
            action={<Button onClick={p.openAdd} leftIcon={<Plus className="h-4 w-4" />}>Add patient</Button>}
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {p.patients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onEdit={() => p.openEdit(patient)}
                  onDelete={() => void p.handleDelete(patient.id)}
                  isDeleting={p.deleting === patient.id}
                />
              ))}
            </div>
            {p.meta ? (
              <div className="mt-6">
                <Pagination meta={p.meta} onPageChange={p.setPage} />
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Add / Edit Modal */}
      {p.modalOpen && (
        <PatientModal
          patient={p.editing}
          saving={p.saving}
          onSave={p.handleSave}
          onClose={p.closeModal}
        />
      )}
    </div>
  );
}

/* ── Patient Card ── */
function PatientCard({
  patient,
  onEdit,
  onDelete,
  isDeleting,
}: {
  patient: Patient;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}): JSX.Element {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden flex flex-col animate-slide-up">
      {/* Color strip */}
      <div className="h-2 bg-gradient-brand" />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name + relationship */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-ink-900 leading-snug">{patient.fullName}</p>
              {patient.relationshipToCustomer && (
                <p className="text-xs text-ink-400">{patient.relationshipToCustomer}</p>
              )}
            </div>
          </div>
          {patient.gender && (
            <span className="text-xs text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full flex-shrink-0">
              {GENDER_LABELS[patient.gender]}
            </span>
          )}
        </div>

        {/* Info rows */}
        <div className="space-y-1.5 text-xs text-ink-500 flex-1">
          {patient.dateOfBirth && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" />
              <span>{calcAge(patient.dateOfBirth)} old</span>
            </div>
          )}
          {patient.primaryCondition && (
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-danger-400 flex-shrink-0" />
              <span className="line-clamp-1">{patient.primaryCondition}</span>
            </div>
          )}
          {patient.allergies && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-accent-500 flex-shrink-0" />
              <span className="line-clamp-1">Allergies: {patient.allergies}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-ink-100">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg ring-1 ring-ink-200 hover:bg-ink-50 text-xs font-semibold text-ink-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-danger-50 hover:bg-danger-100 text-xs font-semibold text-danger-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </Card>
  );
}

/* ── Add / Edit Modal ── */
function PatientModal({
  patient,
  saving,
  onSave,
  onClose,
}: {
  patient: Patient | null;
  saving: boolean;
  onSave: (data: PatientFormData) => Promise<void>;
  onClose: () => void;
}): JSX.Element {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientFormData>();

  useEffect(() => {
    if (patient) {
      reset({
        fullName: patient.fullName,
        gender: patient.gender ?? undefined,
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
        relationshipToCustomer: patient.relationshipToCustomer ?? '',
        primaryCondition: patient.primaryCondition ?? '',
        allergies: patient.allergies ?? '',
        notes: patient.notes ?? '',
      });
    } else {
      reset({});
    }
  }, [patient, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-ink-100 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-ink-100">
          <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-ink-900">
            {patient ? 'Edit patient' : 'Add patient'}
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit((data) => void onSave(data))}
          className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <Input
            label="Full name *"
            {...register('fullName', { required: 'Name is required' })}
            error={errors.fullName?.message}
            placeholder="e.g. Ahmed Khan"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Gender</label>
              <select
                {...register('gender')}
                className="w-full h-10 px-3 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <Input
              label="Date of birth"
              type="date"
              {...register('dateOfBirth')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Relationship</label>
            <select
              {...register('relationshipToCustomer')}
              className="w-full h-10 px-3 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select</option>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <Input
            label="Primary condition"
            {...register('primaryCondition')}
            placeholder="e.g. Diabetes, Hypertension"
          />

          <Input
            label="Allergies"
            {...register('allergies')}
            placeholder="e.g. Penicillin, Peanuts"
          />

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Any additional notes for the healthcare team…"
              className="w-full px-3 py-2 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-ink-100 bg-ink-50/50">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            fullWidth
            isLoading={saving}
            onClick={handleSubmit((data) => void onSave(data))}
          >
            {patient ? 'Save changes' : 'Add patient'}
          </Button>
        </div>
      </div>
    </div>
  );
}
