import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { toE164 } from '../../../component/common/PhoneInput';

// Self-onboarding invite — admin only collects identity. Everything else
// (CNIC, city, services, experience) is filled by the staff member on first
// login via the /complete-profile flow.
const CreateStaffSchema = z.object({
  fullName: z.string().min(2, 'Enter full name').max(150),
  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits after +92')
    .regex(/^[0-9]{10}$/, 'Digits only'),
  email: z.string().email('Invalid email'),
});

export type CreateStaffFormValues = z.infer<typeof CreateStaffSchema>;

export interface CreateStaffSuccess {
  userId: string;
  staffCode: string;
  fullName: string;
  phone: string;
  email: string | null;
  tempPassword: string;
  delivery: { whatsapp: boolean; email: boolean };
}

interface UseCreateStaffReturn {
  form: ReturnType<typeof useForm<CreateStaffFormValues>>;
  onSubmit: (values: CreateStaffFormValues) => Promise<void>;
  isSubmitting: boolean;
  result: CreateStaffSuccess | null;
  resetResult: () => void;
}

export function useCreateStaff(): UseCreateStaffReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateStaffSuccess | null>(null);

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { fullName: '', phone: '', email: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: CreateStaffFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      const { data } = await api.post<{ success: true; data: CreateStaffSuccess }>(
        API.STAFF.LIST,
        { ...values, phone: toE164(values.phone) },
      );
      setResult(data.data);
      form.reset();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit,
    isSubmitting,
    result,
    resetResult: () => setResult(null),
  };
}
