import { useEffect, useState } from 'react';
import { HeartPulse, User, Calendar, AlertCircle } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { Patient } from '../../../types/patient.types';
import type { PaginationMeta } from '../../../types/api.types';

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} yrs`;
}

export function StaffPatients(): JSX.Element {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<{ success: true; data: Patient[]; meta: PaginationMeta }>(
        `${API.USERS.PATIENTS}?page=${page}&limit=20`,
      )
      .then(({ data }) => {
        if (cancelled) return;
        setPatients(data.data);
        setMeta(data.meta);
      })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  return (
    <SidebarLayout title="My Patients" description="Patients from your assigned bookings">
      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-ink-100 animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-7 w-7" />}
          title="No patients yet"
          description="Patients from your assigned bookings will appear here."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((p) => (
              <PatientCard key={p.id} patient={p} />
            ))}
          </div>
          {meta ? (
            <div className="mt-6">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          ) : null}
        </>
      )}
    </SidebarLayout>
  );
}

function PatientCard({ patient }: { patient: Patient }): JSX.Element {
  return (
    <Card variant="elevated" padding="md" className="animate-slide-up">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 truncate">{patient.fullName}</p>
          {patient.relationshipToCustomer ? (
            <p className="text-xs text-ink-500 mt-0.5">{patient.relationshipToCustomer}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5 text-xs text-ink-600">
        {patient.dateOfBirth ? (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" />
            <span>{calcAge(patient.dateOfBirth)} old</span>
          </div>
        ) : null}
        {patient.gender ? (
          <p><span className="font-medium text-ink-700">Gender:</span> {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}</p>
        ) : null}
        {patient.primaryCondition ? (
          <p><span className="font-medium text-ink-700">Condition:</span> {patient.primaryCondition}</p>
        ) : null}
        {patient.allergies ? (
          <p className="text-warning-700"><span className="font-medium">Allergies:</span> {patient.allergies}</p>
        ) : null}
        {patient.notes ? (
          <p className="text-ink-500 line-clamp-2">{patient.notes}</p>
        ) : null}
      </div>

      <p className="text-2xs text-ink-400 mt-3 pt-3 border-t border-ink-100">
        Added {formatDateTime(patient.createdAt)}
      </p>
    </Card>
  );
}
