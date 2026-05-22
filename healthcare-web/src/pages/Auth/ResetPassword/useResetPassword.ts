import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { useAppDispatch } from '../../../redux/store';
import { setAuth, setInitialized } from '../../../redux/slices/authSlice';
import type { LoginResponse } from '../../../types/auth.types';

const ResetPasswordSchema = z
  .object({
    otp: z
      .string()
      .length(6, 'Enter the 6-digit code')
      .regex(/^[0-9]{6}$/, 'Digits only'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

interface UseResetPasswordReturn {
  form: ReturnType<typeof useForm<ResetPasswordFormValues>>;
  onSubmit: (values: ResetPasswordFormValues) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  phone: string | null;
  showNew: boolean;
  showConfirm: boolean;
  toggleShowNew: () => void;
  toggleShowConfirm: () => void;
}

export function useResetPassword(): UseResetPasswordReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = (location.state as { phone?: string } | null)?.phone ?? null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ResetPasswordFormValues): Promise<void> => {
    if (!phone) {
      setServerError('Phone number missing. Please go back and try again.');
      return;
    }
    setIsSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.post<{ success: true; data: LoginResponse }>(
        API.AUTH.RESET_PASSWORD,
        { phone, otp: values.otp, newPassword: values.newPassword },
      );
      dispatch(setAuth({ accessToken: data.data.accessToken, user: data.data.user }));
      dispatch(setInitialized(true));
      toast.success('Password reset! Welcome back.');
      const role = data.data.user.role;
      navigate(role === 'ADMIN' ? '/admin' : role === 'STAFF' ? '/complete-profile' : '/my-bookings', { replace: true });
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    serverError,
    phone,
    showNew,
    showConfirm,
    toggleShowNew: () => setShowNew((v) => !v),
    toggleShowConfirm: () => setShowConfirm((v) => !v),
  };
}
