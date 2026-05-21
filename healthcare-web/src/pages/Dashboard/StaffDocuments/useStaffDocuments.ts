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

  // Flow: presign on our API → multipart POST to Cloudinary with the signed
  // form fields → POST /confirm so the server records the StaffDocument row.
  //
  // Important: Cloudinary's API expects multipart/form-data (file + signed
  // params), NOT a raw PUT like S3. Using PUT triggers a CORS preflight that
  // fails, surfacing as a generic "Network Error" in the browser.
  const uploadDocument = useCallback(
    async (file: File, documentType: string): Promise<void> => {
      if (!userId) return;
      setIsUploading(true);
      try {
        const presignRes = await api.post<{
          success: true;
          data: {
            uploadUrl: string;
            fileKey: string;
            expiresIn: number;
            uploadParams: {
              api_key: string;
              timestamp: number;
              signature: string;
              public_id: string;
              folder: string;
              resource_type: string;
            };
          };
        }>(API.STAFF.DOC_PRESIGN(userId), {
          documentType,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });
        const { uploadUrl, fileKey, uploadParams } = presignRes.data.data;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', uploadParams.api_key);
        formData.append('timestamp', String(uploadParams.timestamp));
        formData.append('signature', uploadParams.signature);
        formData.append('public_id', uploadParams.public_id);
        formData.append('folder', uploadParams.folder);
        // resource_type belongs in the URL path, NOT the form body —
        // Cloudinary's signature was computed without it, adding it here
        // would invalidate the check.

        const uploadRes = await axios.post<{ secure_url: string; public_id: string }>(
          uploadUrl,
          formData,
        );
        const fileUrl = uploadRes.data.secure_url;

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
