import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  User,
  Calendar,
  Heart,
  AlertCircle,
  Search,
  ShieldCheck,
  Sparkles,
  CalendarPlus,
  FileText,
  X,
  Stethoscope,
} from 'lucide-react';
import { TopNav } from '../../../component/common/TopNav';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { Card } from '../../../constant/Card';
import { Pagination } from '../../../component/common/Pagination';
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
  const age = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  return `${age} yrs`;
}

function getAvatarGradient(name: string): string {
  const palettes = [
    'from-brand-600 to-teal-500',
    'from-sky-600 to-indigo-500',
    'from-violet-600 to-purple-500',
    'from-amber-600 to-orange-500',
    'from-rose-600 to-pink-500',
  ];
  const idx = name.charCodeAt(0) % palettes.length;
  return palettes[idx] ?? palettes[0]!;
}

export function MyPatients(): JSX.Element {
  const p = useMyPatients();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [relationFilter, setRelationFilter] = useState<string>('ALL');

  const stats = useMemo(() => {
    const total = p.meta?.total ?? p.patients.length;
    const withConditions = p.patients.filter((item) => Boolean(item.primaryCondition?.trim())).length;
    const withAllergies = p.patients.filter((item) => Boolean(item.allergies?.trim())).length;
    return { total, withConditions, withAllergies };
  }, [p.patients, p.meta?.total]);

  const filteredPatients = useMemo(() => {
    return p.patients.filter((item) => {
      if (relationFilter !== 'ALL') {
        const rel = (item.relationshipToCustomer ?? '').toLowerCase();
        if (relationFilter === 'PARENTS' && !['mother', 'father'].includes(rel)) return false;
        if (relationFilter === 'CHILDREN' && !['son', 'daughter'].includes(rel)) return false;
        if (relationFilter === 'SELF_SPOUSE' && !['self', 'spouse'].includes(rel)) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.fullName.toLowerCase().includes(q) ||
        (item.relationshipToCustomer ?? '').toLowerCase().includes(q) ||
        (item.primaryCondition ?? '').toLowerCase().includes(q) ||
        (item.allergies ?? '').toLowerCase().includes(q)
      );
    });
  }, [p.patients, relationFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50 via-white to-ink-50">
      <TopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* ── Hero Family Care Banner ────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-teal-700 text-white p-6 sm:p-8 shadow-xl shadow-brand-900/10 animate-slide-up">
          <div className="pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-emerald-50 mb-3.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                Family Care Directory · Clinical Safety Profiles
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                My Family Patients
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                Keep medical conditions, age, and allergy alerts ready for your parents, children, and loved ones so our clinicians arrive fully prepared.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={p.openAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-brand-800 font-bold text-sm shadow-lg shadow-black/15 hover:bg-emerald-50 hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  Add Family Member
                </button>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Book a Visit
                </Link>
              </div>
            </div>

            {/* Live Family Metrics */}
            <div className="grid grid-cols-3 gap-3 lg:w-[340px] flex-shrink-0">
              <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 p-3.5 text-center">
                <p className="text-2xl font-black text-white">{stats.total}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Total Profiles</p>
              </div>
              <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 p-3.5 text-center">
                <p className="text-2xl font-black text-white">{stats.withConditions}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Care Conditions</p>
              </div>
              <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/15 p-3.5 text-center">
                <p className="text-2xl font-black text-white">{stats.withAllergies}</p>
                <p className="text-[11px] font-medium text-emerald-100 mt-0.5">Allergy Alerts</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filter & Search Bar ────────────────────────────────────── */}
        <section className="rounded-2xl bg-white border border-ink-100 shadow-2xs p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All Members' },
              { id: 'PARENTS', label: 'Parents' },
              { id: 'SELF_SPOUSE', label: 'Self & Spouse' },
              { id: 'CHILDREN', label: 'Children' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRelationFilter(tab.id)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  relationFilter === tab.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, condition, allergy…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-ink-50 border border-ink-200/80 text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
          </div>
        </section>

        {/* Error */}
        {p.error ? (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 flex items-center justify-between gap-3"
          >
            <span>{p.error}</span>
            <Button size="sm" variant="secondary" onClick={p.reload}>
              Retry
            </Button>
          </div>
        ) : null}

        {/* List */}
        {p.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        ) : p.error ? null : filteredPatients.length === 0 ? (
          <div className="rounded-3xl bg-white border border-dashed border-brand-200 p-10 text-center shadow-2xs">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-ink-900">
              {searchQuery.trim() || relationFilter !== 'ALL'
                ? 'No matching family members found'
                : 'No patient profiles added yet'}
            </h3>
            <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
              {searchQuery.trim() || relationFilter !== 'ALL'
                ? 'Try clearing your search or switching the relationship filter.'
                : 'Add yourself, your parents, or family members to book home visits in seconds.'}
            </p>
            <div className="mt-5">
              {searchQuery.trim() || relationFilter !== 'ALL' ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setRelationFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button onClick={p.openAdd} leftIcon={<Plus className="h-4 w-4" />}>
                  Add First Patient
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onBook={() => navigate('/book')}
                  onEdit={() => p.openEdit(patient)}
                  onDelete={() => void p.handleDelete(patient.id)}
                  isDeleting={p.deleting === patient.id}
                />
              ))}

              {/* Quick "+ Add Another Family Member" Card */}
              <button
                type="button"
                onClick={p.openAdd}
                className="group rounded-3xl border-2 border-dashed border-ink-200 hover:border-brand-400 bg-white/60 hover:bg-brand-50/30 p-6 flex flex-col items-center justify-center text-center transition-all min-h-[230px]"
              >
                <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white group-hover:scale-110 transition-all shadow-2xs">
                  <Plus className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-ink-900 mt-3 group-hover:text-brand-800">
                  Add Another Family Member
                </p>
                <p className="text-xs text-ink-500 mt-1 max-w-[210px]">
                  Create a dedicated health profile for faster home visit booking
                </p>
              </button>
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
  onBook,
  onEdit,
  onDelete,
  isDeleting,
}: {
  patient: Patient;
  onBook: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}): JSX.Element {
  const ageLabel = calcAge(patient.dateOfBirth);
  const avatarGrad = getAvatarGradient(patient.fullName);

  return (
    <Card
      variant="elevated"
      padding="none"
      className="overflow-hidden flex flex-col rounded-3xl border border-ink-100 hover:border-brand-200 hover:shadow-xl transition-all duration-200 animate-slide-up"
    >
      {/* Top Accent Strip */}
      <div className={clsx('h-1.5 bg-gradient-to-r', avatarGrad)} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header: Avatar + Name + Relationship & Gender Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={clsx(
                'h-12 w-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-md',
                avatarGrad,
              )}
            >
              {patient.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-ink-900 text-base truncate leading-snug">
                {patient.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
                  {patient.relationshipToCustomer || 'Family Member'}
                </span>
                {patient.gender ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-ink-100 text-ink-600">
                    {GENDER_LABELS[patient.gender]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Summary Box */}
        <div className="rounded-2xl bg-ink-50/70 border border-ink-100 p-3.5 space-y-2 text-xs flex-1">
          <div className="flex items-center justify-between text-ink-600">
            <span className="inline-flex items-center gap-1.5 text-ink-500 font-medium">
              <Calendar className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
              Age / DOB
            </span>
            <span className="font-semibold text-ink-800">
              {ageLabel ? `${ageLabel} old` : 'Not specified'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 text-ink-600 pt-1.5 border-t border-ink-200/50">
            <span className="inline-flex items-center gap-1.5 text-ink-500 font-medium flex-shrink-0">
              <Heart className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              Condition
            </span>
            <span
              className={clsx(
                'font-semibold text-right line-clamp-1',
                patient.primaryCondition ? 'text-rose-700' : 'text-ink-400 font-normal italic',
              )}
            >
              {patient.primaryCondition || 'None listed'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 text-ink-600 pt-1.5 border-t border-ink-200/50">
            <span className="inline-flex items-center gap-1.5 text-ink-500 font-medium flex-shrink-0">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              Allergies
            </span>
            <span
              className={clsx(
                'font-semibold text-right line-clamp-1',
                patient.allergies ? 'text-amber-700' : 'text-ink-400 font-normal italic',
              )}
            >
              {patient.allergies || 'No known allergies'}
            </span>
          </div>

          {patient.notes ? (
            <div className="pt-1.5 border-t border-ink-200/50 flex items-start gap-1.5 text-ink-500">
              <FileText className="h-3.5 w-3.5 text-ink-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1 italic">{patient.notes}</span>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onBook}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white text-xs font-bold border border-brand-200/80 hover:border-brand-600 transition-all"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Book Care
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl ring-1 ring-ink-200 hover:bg-ink-50 text-xs font-semibold text-ink-700 transition-colors"
            title="Edit profile"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center p-2 rounded-xl bg-danger-50 hover:bg-danger-100 text-xs font-semibold text-danger-700 transition-colors disabled:opacity-50"
            title="Remove profile"
            aria-label="Remove profile"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>();

  const selectedRel = watch('relationshipToCustomer');

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl ring-1 ring-ink-100 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-brand-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">
                {patient ? 'Edit Patient Profile' : 'Add Family Member'}
              </h2>
              <p className="text-xs text-ink-500">
                Clinical details help our medical staff prepare the right care kit.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
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
            placeholder="e.g. Rana Fahad"
          />

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Relationship</label>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIPS.map((r) => {
                const active = selectedRel === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue('relationshipToCustomer', r)}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                      active
                        ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                        : 'bg-ink-50 text-ink-700 border-ink-200 hover:bg-ink-100',
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

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

          <Input
            label="Primary condition (optional)"
            {...register('primaryCondition')}
            placeholder="e.g. Diabetes, Hypertension, Post-surgery recovery"
          />

          <Input
            label="Known allergies (optional)"
            {...register('allergies')}
            placeholder="e.g. Penicillin, Latex, None"
          />

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Care notes for clinician</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Mobility notes, preferred arm for blood draw, or special care instructions…"
              className="w-full px-3 py-2 rounded-xl ring-1 ring-ink-200 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/70 p-3 flex items-center gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Patient medical records are encrypted and visible only to your assigned clinician.</span>
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
            {patient ? 'Save Changes' : 'Add Family Member'}
          </Button>
        </div>
      </div>
    </div>
  );
}
