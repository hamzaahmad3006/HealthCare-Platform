import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, PRESIGN_TTL_SECONDS } from '../utils/constants';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export interface PresignResult {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
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

  const ext = mimeType.split('/')[1] ?? 'bin';
  const fileKey = `${folder}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: PRESIGN_TTL_SECONDS,
  });

  return { uploadUrl, fileKey, expiresIn: PRESIGN_TTL_SECONDS };
}

export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: fileKey,
  });
  await s3.send(command);
}
