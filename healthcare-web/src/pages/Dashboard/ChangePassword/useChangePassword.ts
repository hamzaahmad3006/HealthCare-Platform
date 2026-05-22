import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppDispatch } from '../../../redux/store';
import { setAccessToken } from '../../../redux/slices/authSlice';

const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;

interface UseChangePasswordReturn {
  form: ReturnType<typeof useForm<ChangePasswordFormValues>>;
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  showOld: boolean;
  showNew: boolean;
  showConfirm: boolean;
  toggleShowOld: () => void;
  toggleShowNew: () => void;
  toggleShowConfirm: () => void;
}

export function useChangePassword(): UseChangePasswordReturn {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ChangePasswordFormValues): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.patch<{ success: true; data: { accessToken: string } }>(
        API.AUTH.CHANGE_PASSWORD,
        { oldPassword: values.oldPassword, newPassword: values.newPassword },
      );
      // Backend revoked other sessions but issued a fresh token pair for
      // this session — update Redux so the user stays logged in here.
      dispatch(setAccessToken(data.data.accessToken));
      toast.success('Password changed successfully');
      form.reset();
    } catch (err) {
      const apiErr = extractApiError(err);
      setServerError(apiErr.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    serverError,
    showOld,
    showNew,
    showConfirm,
    toggleShowOld: () => setShowOld((v) => !v),
    toggleShowNew: () => setShowNew((v) => !v),
    toggleShowConfirm: () => setShowConfirm((v) => !v),
  };
}
