import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const RegisterSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name').max(150),
    phone: z
      .string()
      .length(10, 'Phone must be exactly 10 digits after +92')
      .regex(/^[0-9]{10}$/, 'Digits only'),
    email: z.string().email('Enter a valid email').optional().or(z.literal('')),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type RegisterFormValues = z.infer<typeof RegisterSchema>;

interface UseRegisterReturn {
  form: ReturnType<typeof useForm<RegisterFormValues>>;
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
}

interface RegisterRequest {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export function useRegister(): UseRegisterReturn {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const payload: RegisterRequest = {
        fullName: values.fullName.trim(),
        phone: toE164(values.phone),
        password: values.password,
      };
      if (values.email && values.email.length > 0) {
        payload.email = values.email.trim();
      }

      const { data } = await api.post<{ success: true; data: LoginResponse }>(
        API.AUTH.REGISTER,
        payload,
      );

      dispatch(setAuth({ accessToken: data.data.accessToken, user: data.data.user }));
      dispatch(setInitialized(true));
      toast.success(`Welcome, ${data.data.user.fullName.split(' ')[0] ?? 'there'}!`);
      navigate('/my-bookings', { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      setServerError(apiErr.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, onSubmit, isSubmitting, serverError };
}
