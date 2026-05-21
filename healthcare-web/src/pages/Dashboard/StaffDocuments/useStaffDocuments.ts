import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppSelector } from '../../../redux/store';

export interface StaffDocumentRow {
  id: string;
  documentType: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: string;
  verificationStatus: string;
  uploadedAt: string;
}

interface UseStaffDocumentsReturn {
  documents: StaffDocumentRow[];
  isLoading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadDocument: (file: File, documentType: string) => Promise<void>;
}

export function useStaffDocuments(): UseStaffDocumentsReturn {
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);

  const [documents, setDocuments] = useState<StaffDocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const { data } = await api.get<{ success: true; data: StaffDocumentRow[] }>(
          API.STAFF.DOCS(userId),
        );
        if (!cancelled) setDocuments(data.data);
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

  // Mirrors the admin upload flow in useStaffDetail.uploadDocument: presign on
  // our API, PUT directly to the storage provider's signed URL (no auth header
  // — the signature carries the permission), then POST /confirm so the server
  // records the StaffDocument row.
  const uploadDocument = useCallback(
    async (file: File, documentType: string): Promise<void> => {
      if (!userId) return;
      setIsUploading(true);
      try {
        const presignRes = await api.post<{
          success: true;
          data: { uploadUrl: string; fileKey: string; expiresIn: number };
        }>(API.STAFF.DOC_PRESIGN(userId), {
          documentType,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });
        const { uploadUrl, fileKey } = presignRes.data.data;

        await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

        const fileUrl = uploadUrl.split('?')[0] ?? '';
        await api.post(API.STAFF.DOC_CONFIRM(userId), {
          documentType,
          fileKey,
          fileUrl,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });

        toast.success('Document uploaded — admin will review it shortly');
        setReloadFlag((f) => f + 1);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsUploading(false);
      }
    },
    [userId],
  );

  return { documents, isLoading, error, isUploading, uploadDocument };
}
