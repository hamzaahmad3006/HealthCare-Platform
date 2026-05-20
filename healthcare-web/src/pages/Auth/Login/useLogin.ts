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
import { toE164 } from '../../../component/common/PhoneInput';

const LoginSchema = z.object({
  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits after +92')
    .regex(/^[0-9]{10}$/, 'Digits only'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;

interface UseLoginReturn {
  form: ReturnType<typeof useForm<LoginFormValues>>;
  onSubmit: (values: LoginFormValues) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
  showPassword: boolean;
  toggleShowPassword: () => void;
}

export function useLogin(): UseLoginReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { phone: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const { data } = await api.post<{ success: true; data: LoginResponse }>(
        API.AUTH.LOGIN,
        { ...values, phone: toE164(values.phone) },
      );
      dispatch(setAuth({ accessToken: data.data.accessToken, user: data.data.user }));
      dispatch(setInitialized(true));
      toast.success(`Welcome back, ${data.data.user.fullName}`);

      const from = (location.state as { from?: string } | null)?.from;
      const destination =
        from && from !== '/login'
          ? from
          : data.data.user.role === 'ADMIN'
            ? '/admin'
            : data.data.user.role === 'STAFF'
              ? '/admin/visits'
              : '/my-bookings';
      navigate(destination, { replace: true });
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
    showPassword,
    toggleShowPassword: () => setShowPassword((s) => !s),
  };
}
