import { useRef, useState } from 'react';
import { FileText, Upload, ShieldCheck, AlertCircle } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { EmptyState } from '../../../component/common/EmptyState';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { Card } from '../../../constant/Card';
import { Button } from '../../../constant/Button';
import { formatDate } from '../../../helper/format';
import { useAppSelector } from '../../../redux/store';
import { useStaffDocuments } from './useStaffDocuments';

const DOC_TYPES = ['CNIC', 'DEGREE', 'LICENSE', 'EXPERIENCE_LETTER', 'OTHER'] as const;
type DocType = (typeof DOC_TYPES)[number];

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — matches typical S3 presign limit
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

export function StaffDocuments(): JSX.Element {
  const d = useStaffDocuments();
  const verificationStatus = useAppSelector((s) => s.auth.user?.staffVerificationStatus ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocType>(DOC_TYPES[0]);

  const handleFilePick = (): void => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset early so re-picking the same file still fires
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      alert('Only PDF, JPEG, or PNG files are accepted.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      alert('File is too large. Maximum size is 10 MB.');
      return;
    }
    await d.uploadDocument(file, selectedDocType);
  };

  const uploadedTypes = new Set(d.documents.map((doc) => doc.documentType));
  const missingRequired = ['CNIC', 'DEGREE', 'LICENSE'].filter((t) => !uploadedTypes.has(t));

  return (
    <SidebarLayout
      title="My Documents"
      description="Upload your verification documents — CNIC, degree, license, experience letter"
    >
      {verificationStatus === 'VERIFIED' ? (
        <VerifiedBanner />
      ) : missingRequired.length > 0 ? (
        <PendingBanner missing={missingRequired} />
      ) : (
        <UnderReviewBanner />
      )}

      <Card padding="md" className="mt-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink-800">Upload a document</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              PDF, JPEG, or PNG · up to 10 MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value as DocType)}
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
              Choose file
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="md" className="mt-6">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-ink-800">Uploaded documents</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            Admin reviews each document and marks it Verified or Rejected.
          </p>
        </div>

        {d.error ? (
          <div className="px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
            {d.error}
          </div>
        ) : d.isLoading ? (
          <LoadingSpinner size="md" label="Loading documents…" className="py-10" />
        ) : d.documents.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No documents yet"
            description="Pick a document type above and upload your first file to start verification."
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
    </SidebarLayout>
  );
}

function VerifiedBanner(): JSX.Element {
  return (
    <div className="px-4 py-3 rounded-xl bg-success-50 ring-1 ring-success-500/20 text-sm text-success-700 flex items-start gap-3">
      <ShieldCheck className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">You're verified.</p>
        <p className="text-xs mt-0.5 text-success-700">
          You can still upload updated versions if any document expires.
        </p>
      </div>
    </div>
  );
}

function PendingBanner({ missing }: { missing: string[] }): JSX.Element {
  return (
    <div className="px-4 py-3 rounded-xl bg-accent-50 ring-1 ring-accent-500/20 text-sm text-accent-700 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-accent-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Still missing: {missing.map((m) => m.replace(/_/g, ' ')).join(', ')}</p>
        <p className="text-xs mt-0.5 text-accent-700">
          Admin won't be able to verify your account until these are uploaded.
        </p>
      </div>
    </div>
  );
}

function UnderReviewBanner(): JSX.Element {
  return (
    <div className="px-4 py-3 rounded-xl bg-brand-50 ring-1 ring-brand-500/20 text-sm text-brand-800 flex items-start gap-3">
      <ShieldCheck className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">All required documents submitted.</p>
        <p className="text-xs mt-0.5 text-brand-700">
          Admin will review them and update your verification status shortly.
        </p>
      </div>
    </div>
  );
}
