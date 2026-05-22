import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { setAuth } from '../../../redux/slices/authSlice';

const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(150),
  email: z
    .string()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ProfileFormValues = z.infer<typeof ProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

interface UpdateMeResponse {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
}

export function useAccount() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
    },
    mode: 'onBlur',
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSaveProfile = async (values: ProfileFormValues): Promise<void> => {
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const { data } = await api.patch<{ success: true; data: UpdateMeResponse }>(
        API.USERS.ME,
        { fullName: values.fullName, email: values.email ?? null },
      );
      if (user && accessToken) {
        dispatch(setAuth({
          accessToken,
          user: { ...user, fullName: data.data.fullName, email: data.data.email },
        }));
      }
      toast.success('Profile updated.');
    } catch (err) {
      setProfileError(extractApiError(err).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onChangePassword = async (values: ChangePasswordFormValues): Promise<void> => {
    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await api.post(API.AUTH.CHANGE_PASSWORD, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success('Password changed successfully.');
    } catch (err) {
      setPasswordError(extractApiError(err).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    user,
    profileForm,
    passwordForm,
    onSaveProfile,
    onChangePassword,
    isSavingProfile,
    isChangingPassword,
    profileError,
    passwordError,
    showOld,
    showNew,
    showConfirm,
    toggleShowOld: () => setShowOld((v) => !v),
    toggleShowNew: () => setShowNew((v) => !v),
    toggleShowConfirm: () => setShowConfirm((v) => !v),
  };
}
