import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { toE164 } from '../../../component/common/PhoneInput';

const CreateStaffSchema = z.object({
  fullName: z.string().min(2, 'Enter full name').max(150),
  phone: z
    .string()
    .length(10, 'Phone must be exactly 10 digits after +92')
    .regex(/^[0-9]{10}$/, 'Digits only'),
  email: z.string().email('Invalid email').optional().or(z.literal('').transform(() => undefined)),
  cityId: z.string().uuid('Select a city'),
  zoneId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  cnic: z.string().min(13, 'CNIC must be at least 13 digits').max(25),
  dateOfBirth: z.string().optional().or(z.literal('').transform(() => undefined)),
  experienceYears: z.coerce.number().int().min(0).default(0),
  serviceTypeIds: z.array(z.string().uuid()).min(1, 'Select at least one service'),
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

interface ServiceType {
  id: string;
  code: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  zones?: Array<{ id: string; name: string }>;
}

interface UseCreateStaffReturn {
  form: ReturnType<typeof useForm<CreateStaffFormValues>>;
  onSubmit: (values: CreateStaffFormValues) => Promise<void>;
  isSubmitting: boolean;
  result: CreateStaffSuccess | null;
  resetResult: () => void;
  services: ServiceType[];
  cities: City[];
  zonesForSelectedCity: Array<{ id: string; name: string }>;
  isLoadingOptions: boolean;
}

export function useCreateStaff(open: boolean): UseCreateStaffReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateStaffSuccess | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      cityId: '',
      zoneId: '',
      gender: undefined,
      cnic: '',
      dateOfBirth: '',
      experienceYears: 0,
      serviceTypeIds: [],
    },
    mode: 'onBlur',
  });

  // Lazy-fetch dropdown options the first time the modal opens.
  useEffect(() => {
    if (!open || cities.length > 0) return;
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoadingOptions(true);
      try {
        const [servicesRes, citiesRes] = await Promise.all([
          api.get<{ success: true; data: ServiceType[] }>(API.SERVICE_TYPES),
          api.get<{ success: true; data: City[] }>('/cities'),
        ]);
        if (cancelled) return;
        setServices(servicesRes.data.data);
        setCities(citiesRes.data.data);
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoadingOptions(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, cities.length]);

  const selectedCityId = form.watch('cityId');
  const zonesForSelectedCity =
    cities.find((c) => c.id === selectedCityId)?.zones ?? [];

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
    services,
    cities,
    zonesForSelectedCity,
    isLoadingOptions,
  };
}
