export interface SignedUpload {
  uploadUrl: string;
  fileKey: string;
  uploadParams: {
    api_key: string;
    timestamp: number;
    signature: string;
    public_id: string;
    resource_type: string;
  };
}

// Keep this form aligned with the backend signature: the public ID already
// contains the folder; resource_type belongs only in the upload URL.
export async function uploadSignedFile(file: File, signed: SignedUpload): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signed.uploadParams.api_key);
  form.append('timestamp', String(signed.uploadParams.timestamp));
  form.append('signature', signed.uploadParams.signature);
  form.append('public_id', signed.uploadParams.public_id);
  const response = await fetch(signed.uploadUrl, { method: 'POST', body: form });
  if (!response.ok) throw new Error('File upload failed. Please try again.');
  const uploaded: unknown = await response.json();
  if (
    !uploaded ||
    typeof uploaded !== 'object' ||
    !('secure_url' in uploaded) ||
    typeof (uploaded as { secure_url: unknown }).secure_url !== 'string' ||
    !('public_id' in uploaded) ||
    typeof (uploaded as { public_id: unknown }).public_id !== 'string'
  ) {
    throw new Error('Storage returned an invalid upload response. Please try again.');
  }

  const uploadResult = uploaded as { secure_url: string; public_id: string };
  const uploadedPublicId = uploadResult.public_id;
  const matchesPublicId =
    uploadedPublicId === signed.fileKey ||
    uploadedPublicId.replace(/\.[^/.]+$/, '') === signed.fileKey;

  if (!matchesPublicId) {
    throw new Error('Storage returned an invalid upload response. Please try again.');
  }

  const url = new URL(uploadResult.secure_url);
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    throw new Error('Storage returned an invalid file URL. Please try again.');
  }
  return uploadResult.secure_url;
}
