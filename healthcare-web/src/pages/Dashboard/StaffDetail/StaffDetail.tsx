import { useRef, useState } from 'react';
import { ArrowLeft, BadgeCheck, Phone, Mail, MapPin, FileText, Upload, ToggleLeft, ToggleRight } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { EmptyState } from '../../../component/common/EmptyState';
import { Card } from '../../../constant/Card';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import { formatDate } from '../../../helper/format';
import { useStaffDetail } from './useStaffDetail';

const DOC_TYPES = ['CNIC', 'DEGREE', 'LICENSE', 'EXPERIENCE_LETTER', 'OTHER'] as const;

export function StaffDetail(): JSX.Element {
  const d = useStaffDetail();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>(DOC_TYPES[0]);

  if (d.isLoading || !d.staff) {
    return (
      <SidebarLayout title="Staff detail">
        <LoadingSpinner size="lg" label="Loading staff…" className="py-20" />
      </SidebarLayout>
    );
  }

  const s = d.staff;

  const handleFilePick = (): void => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      await d.uploadDocument(file, selectedDocType);
      e.target.value = '';
    }
  };

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

          {/* Documents */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-ink-800">Documents</h3>
                <p className="text-xs text-ink-500 mt-0.5">CNIC, degree, license, experience letter</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg ring-1 ring-ink-200 outline-none focus:ring-brand-500 bg-white"
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={handleFilePick}
                  isLoading={d.isUploading}
                  leftIcon={<Upload className="h-3.5 w-3.5" />}
                >
                  Upload
                </Button>
              </div>
            </div>
            {d.documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No documents uploaded"
                description="Upload CNIC, degree, and license to complete verification."
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
