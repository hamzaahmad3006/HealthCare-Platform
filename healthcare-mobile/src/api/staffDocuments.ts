import { api } from './client';
import { API } from './endpoints';
import type { PresignResult } from '../types/report.types';
import type {
  StaffDocumentType,
  VerificationFile,
} from '../types/staffOnboarding.types';
import { validateVerificationFile } from '../utils/staffOnboarding';

export async function uploadStaffDocument(
  userId: string,
  documentType: StaffDocumentType,
  file: VerificationFile,
): Promise<void> {
  validateVerificationFile(file);
  const metadata = {
    documentType,
    mimeType: file.type,
    fileSizeBytes: file.size,
  };
  const { data } = await api.post<{ data: PresignResult }>(
    API.STAFF.DOC_PRESIGN(userId),
    metadata,
  );
  const { uploadUrl, fileKey, uploadParams } = data.data;
  const body = new FormData();
  // React Native's native FormData implementation accepts URI file parts.
  body.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  body.append('api_key', uploadParams.api_key);
  body.append('timestamp', String(uploadParams.timestamp));
  body.append('signature', uploadParams.signature);
  body.append('public_id', uploadParams.public_id);
  // Signed public_id includes the folder; do not append folder/resource_type.
  // Use fetch rather than the authenticated API client: never forward auth tokens.
  const response = await fetch(uploadUrl, { method: 'POST', body });
  if (!response.ok)
    throw new Error('Document upload failed. Please try again.');
  const uploaded: { secure_url?: string; public_id?: string } =
    await response.json();
  if (
    !uploaded.secure_url?.startsWith('https://') ||
    uploaded.public_id !== fileKey
  )
    throw new Error('The upload could not be verified. Please try again.');
  await api.post(API.STAFF.DOC_CONFIRM(userId), {
    ...metadata,
    fileKey,
    fileUrl: uploaded.secure_url,
  });
}
