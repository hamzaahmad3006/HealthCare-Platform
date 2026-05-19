import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { StaffWithRelations } from '../../../types/staff.types';

interface StaffDocumentRow {
  id: string;
  documentType: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: string;
  verificationStatus: string;
  uploadedAt: string;
}

interface UseStaffDetailReturn {
  staff: StaffWithRelations | null;
  documents: StaffDocumentRow[];
  isLoading: boolean;
  error: string | null;

  isVerifying: boolean;
  handleVerify: () => Promise<void>;

  isTogglingAvailability: boolean;
  handleToggleAvailability: () => Promise<void>;

  isUploading: boolean;
  uploadDocument: (file: File, documentType: string) => Promise<void>;

  goBack: () => void;
}

export function useStaffDetail(): UseStaffDetailReturn {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffWithRelations | null>(null);
  const [documents, setDocuments] = useState<StaffDocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const [staffRes, docsRes] = await Promise.all([
          api.get<{ success: true; data: StaffWithRelations }>(API.STAFF.BY_ID(userId)),
          api
            .get<{ success: true; data: StaffDocumentRow[] }>(API.STAFF.DOCS(userId))
            .catch(() => ({ data: { success: true as const, data: [] as StaffDocumentRow[] } })),
        ]);
        if (cancelled) return;
        setStaff(staffRes.data.data);
        setDocuments(docsRes.data.data);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, reloadFlag]);

  const handleVerify = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setIsVerifying(true);
    try {
      await api.post(API.STAFF.VERIFY(userId));
      toast.success('Staff verified');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsVerifying(false);
    }
  }, [userId]);

  const handleToggleAvailability = useCallback(async (): Promise<void> => {
    if (!userId) return;
    setIsTogglingAvailability(true);
    try {
      await api.patch(API.STAFF.AVAILABILITY(userId));
      toast.success('Availability updated');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsTogglingAvailability(false);
    }
  }, [userId]);

  // Presign → S3 PUT → Confirm flow.
  const uploadDocument = useCallback(
    async (file: File, documentType: string): Promise<void> => {
      if (!userId) return;
      setIsUploading(true);
      try {
        // 1. Presign
        const presignRes = await api.post<{
          success: true;
          data: { uploadUrl: string; fileKey: string; expiresIn: number };
        }>(API.STAFF.DOC_PRESIGN(userId), {
          documentType,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });
        const { uploadUrl, fileKey } = presignRes.data.data;

        // 2. Direct S3 PUT — no auth header, axios instance bypassed.
        await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

        // 3. Confirm
        const fileUrl = uploadUrl.split('?')[0] ?? '';
        await api.post(API.STAFF.DOC_CONFIRM(userId), {
          documentType,
          fileKey,
          fileUrl,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });

        toast.success('Document uploaded');
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsUploading(false);
      }
    },
    [userId],
  );

  return {
    staff,
    documents,
    isLoading,
    error,
    isVerifying,
    handleVerify,
    isTogglingAvailability,
    handleToggleAvailability,
    isUploading,
    uploadDocument,
    goBack: () => navigate('/admin/staff'),
  };
}
