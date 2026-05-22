import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { toE164 } from '../../../component/common/PhoneInput';

const ForgotPasswordSchema = z.object({
  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits after +92')
    .regex(/^[0-9]{10}$/, 'Digits only'),
});

export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;

interface UseForgotPasswordReturn {
  form: ReturnType<typeof useForm<ForgotPasswordFormValues>>;
  onSubmit: (values: ForgotPasswordFormValues) => Promise<void>;
  isSubmitting: boolean;
  serverError: string | null;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { phone: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: ForgotPasswordFormValues): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const phone = toE164(values.phone);
      await api.post(API.AUTH.FORGOT_PASSWORD, { phone });
      // Navigate to reset page, passing the phone so the user doesn't re-type it.
      navigate('/auth/reset-password', { state: { phone } });
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, onSubmit, isSubmitting, serverError };
}
