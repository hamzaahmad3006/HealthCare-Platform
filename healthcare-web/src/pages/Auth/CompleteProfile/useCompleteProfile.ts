import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';

const CompleteProfileSchema = z.object({
  cityId: z.string().uuid('Select a city'),
  zoneId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  cnic: z
    .string()
    .min(13, 'CNIC must be at least 13 digits')
    .max(25)
    .regex(/^[0-9-]+$/, 'CNIC must be digits and dashes only'),
  dateOfBirth: z.string().optional().or(z.literal('').transform(() => undefined)),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  serviceTypeIds: z.array(z.string().uuid()).min(1, 'Pick at least one service'),
});

export type CompleteProfileFormValues = z.infer<typeof CompleteProfileSchema>;

export interface ServiceTypeOption {
  id: string;
  code: string;
  name: string;
}

export interface CityOption {
  id: string;
  name: string;
  zones?: Array<{ id: string; name: string }>;
}

export interface StaffMe {
  staffCode: string;
  profileCompletedAt: string | null;
  cityId: string | null;
  zoneId: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  cnic: string | null;
  dateOfBirth: string | null;
  experienceYears: number;
  user: { fullName: string; phone: string; email: string | null };
  serviceTypes: Array<{ serviceType: ServiceTypeOption }>;
}

interface UseCompleteProfileReturn {
  form: ReturnType<typeof useForm<CompleteProfileFormValues>>;
  onSubmit: (values: CompleteProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  isLoading: boolean;
  me: StaffMe | null;
  services: ServiceTypeOption[];
  cities: CityOption[];
  zonesForSelectedCity: Array<{ id: string; name: string }>;
  selectedServiceIds: string[];
  toggleService: (id: string) => void;
}

export function useCompleteProfile(): UseCompleteProfileReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [services, setServices] = useState<ServiceTypeOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(CompleteProfileSchema),
    defaultValues: {
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

  // On mount, fetch the staff's current profile + reference data in parallel.
  // Pre-fill the form with anything the staff already saved (so the page is
  // idempotent and the staff can come back and edit).
  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [meRes, servicesRes, citiesRes] = await Promise.all([
          api.get<{ success: true; data: StaffMe }>(API.STAFF.ME),
          api.get<{ success: true; data: ServiceTypeOption[] }>(API.SERVICE_TYPES),
          api.get<{ success: true; data: CityOption[] }>('/cities'),
        ]);
        if (cancelled) return;
        setMe(meRes.data.data);
        setServices(servicesRes.data.data);
        setCities(citiesRes.data.data);

        const meData = meRes.data.data;
        // Already completed? Skip the form entirely.
        if (meData.profileCompletedAt) {
          navigate('/admin/visits', { replace: true });
          return;
        }
        form.reset({
          cityId: meData.cityId ?? '',
          zoneId: meData.zoneId ?? '',
          gender: meData.gender ?? undefined,
          cnic: meData.cnic ?? '',
          dateOfBirth: meData.dateOfBirth ? meData.dateOfBirth.slice(0, 10) : '',
          experienceYears: meData.experienceYears ?? 0,
          serviceTypeIds: meData.serviceTypes.map((s) => s.serviceType.id),
        });
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCityId = form.watch('cityId');
  const zonesForSelectedCity = cities.find((c) => c.id === selectedCityId)?.zones ?? [];
  const selectedServiceIds = form.watch('serviceTypeIds') ?? [];

  const toggleService = (id: string): void => {
    const next = selectedServiceIds.includes(id)
      ? selectedServiceIds.filter((s) => s !== id)
      : [...selectedServiceIds, id];
    form.setValue('serviceTypeIds', next, { shouldValidate: true });
  };

  const onSubmit = async (values: CompleteProfileFormValues): Promise<void> => {
    setIsSubmitting(true);
    try {
      await api.patch(API.STAFF.MY_PROFILE, values);
      toast.success('Profile saved — upload your documents next');
      navigate('/admin/visits', { replace: true });
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
    isLoading,
    me,
    services,
    cities,
    zonesForSelectedCity,
    selectedServiceIds,
    toggleService,
  };
}
