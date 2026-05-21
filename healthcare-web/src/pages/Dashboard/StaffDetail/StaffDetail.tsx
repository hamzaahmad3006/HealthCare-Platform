import { ArrowLeft, BadgeCheck, Phone, Mail, MapPin, FileText, ToggleLeft, ToggleRight, Check, X, Loader2 } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { EmptyState } from '../../../component/common/EmptyState';
import { Card } from '../../../constant/Card';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import { formatDate } from '../../../helper/format';
import { useStaffDetail } from './useStaffDetail';

export function StaffDetail(): JSX.Element {
  const d = useStaffDetail();

  if (d.isLoading || !d.staff) {
    return (
      <SidebarLayout title="Staff detail">
        <LoadingSpinner size="lg" label="Loading staff…" className="py-20" />
      </SidebarLayout>
    );
  }

  const s = d.staff;

  return (
    <SidebarLayout
      title={s.user.fullName}
      description={`${s.staffCode} · ${s.city.name}`}
      actions={
        <Button variant="ghost" size="sm" onClick={d.goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile column */}
        <div className="space-y-6">
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-brand text-white flex items-center justify-center text-2xl font-bold shadow-brand">
              {s.user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900">{s.user.fullName}</h2>
            <p className="text-2xs font-mono text-ink-500 mt-1">{s.staffCode}</p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <StatusBadge status={s.verificationStatus} kind="verif" />
              <Badge tone={s.isAvailable ? 'success' : 'neutral'} dot>
                {s.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            <div className="mt-6 space-y-2 text-left">
              <p className="text-sm text-ink-700 inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-ink-400" />
                {s.user.phone}
              </p>
              {s.user.email ? (
                <p className="text-sm text-ink-700 inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-ink-400" />
                  {s.user.email}
                </p>
              ) : null}
              <p className="text-sm text-ink-700 inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-400" />
                {s.city.name}
                {s.zone ? ` · ${s.zone.name}` : ''}
              </p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-ink-50">
                <p className="text-2xl font-bold text-ink-900">{s.experienceYears}</p>
                <p className="text-2xs text-ink-500 uppercase tracking-wider mt-0.5">years exp</p>
              </div>
              <div className="p-3 rounded-xl bg-ink-50">
                <p className="text-2xl font-bold text-ink-900">{s.serviceTypes.length}</p>
                <p className="text-2xs text-ink-500 uppercase tracking-wider mt-0.5">services</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Quick actions</h3>
            <div className="space-y-2">
              {s.verificationStatus !== 'VERIFIED' ? (
                <Button
                  fullWidth
                  onClick={() => void d.handleVerify()}
                  isLoading={d.isVerifying}
                  leftIcon={<BadgeCheck className="h-4 w-4" />}
                >
                  Verify staff
                </Button>
              ) : null}
              <Button
                fullWidth
                variant="outline"
                onClick={() => void d.handleToggleAvailability()}
                isLoading={d.isTogglingAvailability}
                leftIcon={s.isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
              >
                {s.isAvailable ? 'Mark unavailable' : 'Mark available'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Service types</h3>
            <div className="flex flex-wrap gap-2">
              {s.serviceTypes.length === 0 ? (
                <p className="text-sm text-ink-500 italic">No services assigned.</p>
              ) : (
                s.serviceTypes.map((st) => (
                  <Badge key={st.serviceType.id} tone="brand">
                    {st.serviceType.name}
                  </Badge>
                ))
              )}
            </div>
          </Card>

          {/* Documents — read-only review surface. Upload lives in the staff
              portal at /staff/documents so the audit trail records the staff
              as the uploader. Admin only Verifies or Rejects what's here. */}
          <Card padding="md">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink-800">Documents</h3>
              <p className="text-xs text-ink-500 mt-0.5">
                Review each document submitted by the staff and mark it Verified or Rejected.
              </p>
            </div>
            {d.documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No documents uploaded yet"
                description="The staff hasn't uploaded any documents. Ask them to do so from their portal."
              />
            ) : (
              <ul className="space-y-2">
                {d.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl ring-1 ring-ink-100 hover:ring-ink-200 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900 truncate">
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-2xs text-ink-500">
                          {doc.mimeType} · uploaded {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.verificationStatus} kind="verif" size="sm" />
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        View
                      </a>
                      {doc.verificationStatus !== 'VERIFIED' ? (
                        <button
                          onClick={() => void d.reviewDocument(doc.id, 'VERIFIED')}
                          disabled={d.reviewingDocId === doc.id}
                          title="Mark this document as verified"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-lg bg-success-50 text-success-700 ring-1 ring-success-500/20 hover:bg-success-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {d.reviewingDocId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Verify
                        </button>
                      ) : null}
                      {doc.verificationStatus !== 'REJECTED' ? (
                        <button
                          onClick={() => void d.reviewDocument(doc.id, 'REJECTED')}
                          disabled={d.reviewingDocId === doc.id}
                          title="Mark this document as rejected"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-lg bg-danger-50 text-danger-700 ring-1 ring-danger-500/20 hover:bg-danger-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {d.reviewingDocId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          Reject
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
