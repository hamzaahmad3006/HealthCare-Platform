import { BusinessError } from '../utils/stateMachine';

// Confirm only assets in the namespace for which this actor can obtain a signature.
// The URL and key must describe the same asset in our configured storage account.
export function assertUploadTarget(
  target: { fileKey: string; fileUrl: string; mimeType: string },
  folder: string,
  cloudName: string,
): void {
  const suffix = target.fileKey.slice(folder.length + 1);
  const url = new URL(target.fileUrl);
  const resource = target.mimeType.startsWith('image/') ? 'image' : 'raw';
  const prefix = `/${cloudName}/${resource}/upload/`;
  const asset = url.pathname.slice(prefix.length).replace(/^v\d+\//, '');
  const extension = target.mimeType === 'image/png' ? 'png' : target.mimeType === 'image/jpeg' ? 'jpg' : 'pdf';
  const validAssets = [target.fileKey, `${target.fileKey}.${extension}`];
  if (target.mimeType === 'image/jpeg') validAssets.push(`${target.fileKey}.jpeg`);
  if (!target.fileKey.startsWith(`${folder}/`) || !/^[A-Za-z0-9_-]+$/.test(suffix) ||
      url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com' || url.port || url.username || url.password ||
      url.search || url.hash || !url.pathname.startsWith(prefix) || !validAssets.includes(asset)) {
    throw new BusinessError('INVALID_UPLOAD_TARGET', 'Use the file returned by the signed upload for this record');
  }
}
