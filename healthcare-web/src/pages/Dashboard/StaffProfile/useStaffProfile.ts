import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { setUser } from '../../../redux/slices/authSlice';
import type { Gender } from '../../../types/booking.types';
import type { VerifStatus } from '../../../types/staff.types';

export interface MyStaffProfile {
  userId: string;
  staffCode: string;
  cityId: string | null;
  zoneId: string | null;
  gender: Gender | null;
  cnic: string | null;
  dateOfBirth: string | null;
  experienceYears: number;
  profileCompletedAt: string | null;
  verificationStatus: VerifStatus;
  verifiedAt: string | null;
  isAvailable: boolean;
  ambulanceNumber: string | null;
  user: { fullName: string; phone: string; email: string | null; avatarUrl?: string | null };
  city: { id: string; name: string } | null;
  zone: { id: string; name: string } | null;
  serviceTypes: Array<{ serviceType: { id: string; code: string; name: string } }>;
}

interface UseStaffProfileReturn {
  profile: MyStaffProfile | null;
  isLoading: boolean;
  error: string | null;
  isUploadingAvatar: boolean;
  uploadAvatar: (file: File) => Promise<void>;
  isTogglingAvailability: boolean;
  toggleAvailability: () => Promise<void>;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png'];

export function useStaffProfile(): UseStaffProfileReturn {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((s) => s.auth.user);

  const [profile, setProfile] = useState<MyStaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const { data } = await api.get<{ success: true; data: MyStaffProfile }>(API.STAFF.ME);
        if (!cancelled) setProfile(data.data);
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
  }, [reloadFlag]);

  // Reuses the staff document presign endpoint — it just signs a Cloudinary
  // upload URL (no DB row inserted there). We deliberately do NOT call
  // /documents/confirm afterwards because the StaffDocument table is for
  // verification artefacts, not profile pictures. The final URL goes through
  // /staff/me/avatar which updates User.avatarUrl in place.
  const uploadAvatar = useCallback(
    async (file: File): Promise<void> => {
      if (!reduxUser?.id) return;
      if (!ALLOWED_AVATAR_MIME.includes(file.type)) {
        toast.error('Avatar must be a JPEG or PNG image.');
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        toast.error('Image is too large. Max 5 MB.');
        return;
      }

      setIsUploadingAvatar(true);
      try {
        const presignRes = await api.post<{
          success: true;
          data: {
            uploadUrl: string;
            fileKey: string;
            uploadParams: {
              api_key: string;
              timestamp: number;
              signature: string;
              public_id: string;
              folder: string;
              resource_type: string;
            };
          };
        }>(API.STAFF.DOC_PRESIGN(reduxUser.id), {
          documentType: 'AVATAR',
          mimeType: file.type,
          fileSizeBytes: file.size,
        });
        const { uploadUrl, uploadParams } = presignRes.data.data;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', uploadParams.api_key);
        formData.append('timestamp', String(uploadParams.timestamp));
        formData.append('signature', uploadParams.signature);
        formData.append('public_id', uploadParams.public_id);
        formData.append('folder', uploadParams.folder);

        const uploadRes = await axios.post<{ secure_url: string }>(uploadUrl, formData);
        const avatarUrl = uploadRes.data.secure_url;

        const patchRes = await api.patch<{
          success: true;
          data: { id: string; avatarUrl: string };
        }>(API.STAFF.MY_AVATAR, { avatarUrl });

        // Keep Redux in sync so the sidebar / header avatar updates without
        // a refresh. Reload the page-level profile too so the big avatar
        // re-renders with the new URL.
        if (reduxUser) {
          dispatch(setUser({ ...reduxUser, avatarUrl: patchRes.data.data.avatarUrl }));
        }
        setReloadFlag((f) => f + 1);
        toast.success('Profile picture updated');
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setIsUploadingAvatar(false);
      }
    },
    [reduxUser, dispatch],
  );

  const toggleAvailability = useCallback(async (): Promise<void> => {
    if (!profile) return;
    setIsTogglingAvailability(true);
    try {
      await api.patch(API.STAFF.AVAILABILITY(profile.userId), { isAvailable: !profile.isAvailable });
      toast.success(profile.isAvailable ? 'You are now unavailable' : 'You are now available');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsTogglingAvailability(false);
    }
  }, [profile]);

  return { profile, isLoading, error, isUploadingAvatar, uploadAvatar, isTogglingAvailability, toggleAvailability };
}
