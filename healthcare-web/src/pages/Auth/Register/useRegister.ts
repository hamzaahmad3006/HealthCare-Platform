import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { extractApiError } from '../../../helper/axios';

// NOTE: Public customer self-registration is not currently a backend endpoint
// (SRS Section 3 — customers are created on first booking). This hook is wired
// for the form UI; when the endpoint is added it will POST to /users/register.

const RegisterSchema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name').max(150),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
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

export function useRegister(): UseRegisterReturn {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (_values: RegisterFormValues): Promise<void> => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      // Placeholder — the customer registration endpoint will be added once
      // the booking-form flow auto-provisions accounts is removed. For now,
      // direct users to call the support number.
      await new Promise((r) => setTimeout(r, 800));
      toast.success('Account created. Please log in to continue.');
      navigate('/login');
    } catch (err) {
      setServerError(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { form, onSubmit, isSubmitting, serverError };
}
