import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, PRESIGN_TTL_SECONDS } from '../utils/constants';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface PresignResult {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
  // Cloudinary's signed upload form parameters — frontend POSTs the file +
  // these fields as multipart/form-data to uploadUrl. S3 presigned PUTs
  // didn't need this; Cloudinary does, so we surface it here.
  uploadParams: {
    api_key: string;
    timestamp: number;
    signature: string;
    public_id: string;
    resource_type: string;
  };
}

// Map MIME types to Cloudinary resource_type. Cloudinary classifies files as
// 'image', 'video', or 'raw' (everything else including PDF). Using the wrong
// type breaks delivery URLs.
function resourceTypeFor(mimeType: string): 'image' | 'raw' {
  if (mimeType.startsWith('image/')) return 'image';
  return 'raw';
}

export async function getPresignedUploadUrl(
  folder: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<PresignResult> {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`INVALID_MIME_TYPE: ${mimeType}`);
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`FILE_TOO_LARGE: max ${MAX_FILE_SIZE_BYTES} bytes`);
  }

  const resourceType = resourceTypeFor(mimeType);
  const publicId = `${folder}/${uuidv4()}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Sign only public_id + timestamp — do NOT include folder separately
  // because public_id already encodes the full path. Including folder would
  // cause Cloudinary to prepend it again and create a doubled path.
  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, timestamp },
    env.CLOUDINARY_API_SECRET,
  );

  const uploadUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  return {
    uploadUrl,
    fileKey: publicId,
    expiresIn: PRESIGN_TTL_SECONDS,
    uploadParams: {
      api_key: env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      public_id: publicId,
      resource_type: resourceType,
    },
  };
}

// Extract public_id from a Cloudinary secure_url — always use the stored URL as
// the source of truth because fileKey may not match actual Cloudinary path for
// assets uploaded before the folder-doubling bug was fixed.
function publicIdFromUrl(fileUrl: string): string {
  const match = fileUrl.match(/\/upload\/(?:v\d+\/)?([^?]+)/);
  return match ? match[1] : fileUrl;
}

export function signDeliveryUrl(fileUrl: string, mimeType: string, ttlSeconds = 3600): string {
  const resourceType = resourceTypeFor(mimeType);
  const publicId = publicIdFromUrl(fileUrl);
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: 'upload',
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    secure: true,
  });
}

export async function deleteFile(fileKey: string, mimeType?: string): Promise<void> {
  const resourceType = mimeType ? resourceTypeFor(mimeType) : 'raw';
  const options: UploadApiOptions = { resource_type: resourceType, invalidate: true };
  await cloudinary.uploader.destroy(fileKey, options);
}
