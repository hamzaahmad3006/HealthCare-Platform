import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';

const CompleteProfileSchema = z
  .object({
    cityId: z.string().uuid('Select a city'),
    zoneId: z.string().optional().or(z.literal('').transform(() => undefined)),
    customZoneName: z.string().optional().or(z.literal('').transform(() => undefined)),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    cnic: z
      .string()
      .length(13, 'CNIC must be exactly 13 digits')
      .regex(/^[0-9]{13}$/, 'CNIC must contain numbers only (13 digits)'),
    dateOfBirth: z.string().optional().or(z.literal('').transform(() => undefined)),
    experienceYears: z.coerce.number().int().min(0).max(60).default(0),
    serviceTypeIds: z.array(z.string().uuid()).min(1, 'Pick at least one service'),
    ambulanceNumber: z
      .string()
      .max(20, 'Ambulance number is too long')
      .regex(/^[A-Za-z0-9\- ]*$/, 'Letters, digits, dashes, and spaces only')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .refine(
    (data) => {
      if (data.zoneId === 'OTHER' && (!data.customZoneName || data.customZoneName.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Please enter your zone or area name',
      path: ['customZoneName'],
    },
  );

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

const DEFAULT_FAISALABAD: CityOption = {
  id: '30cf9d53-deb8-486e-840e-acc8113a8411',
  name: 'Faisalabad',
  zones: [
    { id: '1427a807-caff-4b02-ac21-ec2362a22f1e', name: 'Gulberg' },
    { id: '29b44d3b-fee4-4295-a6f4-2fe61ba5af1d', name: 'Madina Town' },
    { id: 'c68828d9-9c7d-426d-a2f8-8b5e52344f46', name: 'Peoples Colony' },
    { id: '681d1a89-81f7-45c2-9d3b-6df6b10e9f28', name: 'Dijkot Road' },
  ],
};

export interface StaffMe {
  staffCode: string;
  profileCompletedAt: string | null;
  cityId: string | null;
  zoneId: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  cnic: string | null;
  dateOfBirth: string | null;
  experienceYears: number;
  ambulanceNumber: string | null;
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
  needsAmbulanceNumber: boolean;
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
      customZoneName: '',
      gender: undefined,
      cnic: '',
      dateOfBirth: '',
      experienceYears: 0,
      serviceTypeIds: [],
      ambulanceNumber: '',
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
        const [meResult, servicesResult, citiesResult] = await Promise.allSettled([
          api.get<{ success: true; data: StaffMe }>(API.STAFF.ME),
          api.get<{ success: true; data: ServiceTypeOption[] }>(API.SERVICE_TYPES),
          api.get<{ success: true; data: CityOption[] }>('/cities'),
        ]);

        if (cancelled) return;

        // 1. Process Cities (guarantee Faisalabad is present and populated)
        let loadedCities: CityOption[] = [];
        if (citiesResult.status === 'fulfilled' && citiesResult.value.data.data?.length > 0) {
          loadedCities = citiesResult.value.data.data;
        } else {
          loadedCities = [DEFAULT_FAISALABAD];
        }
        setCities(loadedCities);

        const faisalabad =
          loadedCities.find((c) => c.name.toLowerCase() === 'faisalabad') ?? loadedCities[0];
        const defaultCityId = faisalabad?.id ?? DEFAULT_FAISALABAD.id;

        // 2. Process Service Types
        if (servicesResult.status === 'fulfilled' && servicesResult.value.data.data) {
          setServices(servicesResult.value.data.data);
        }

        // 3. Process Staff Me Profile
        if (meResult.status === 'fulfilled' && meResult.value.data.data) {
          const meData = meResult.value.data.data;
          setMe(meData);

          // Already completed? Skip the form entirely.
          if (meData.profileCompletedAt) {
            navigate('/staff/visits', { replace: true });
            return;
          }

          form.reset({
            cityId: meData.cityId || defaultCityId,
            zoneId: meData.zoneId ?? '',
            gender: meData.gender ?? undefined,
            cnic: meData.cnic ? meData.cnic.replace(/\D/g, '').slice(0, 13) : '',
            dateOfBirth: meData.dateOfBirth ? meData.dateOfBirth.slice(0, 10) : '',
            experienceYears: meData.experienceYears ?? 0,
            serviceTypeIds: meData.serviceTypes ? meData.serviceTypes.map((s) => s.serviceType.id) : [],
            ambulanceNumber: meData.ambulanceNumber ?? '',
          });
        } else {
          // If viewing as admin or before staff profile is created, auto-select Faisalabad
          form.setValue('cityId', defaultCityId);
        }
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

  // Reset zoneId whenever the user picks a different city.
  const prevCityRef = useRef<string>('');
  useEffect(() => {
    if (prevCityRef.current !== '' && prevCityRef.current !== selectedCityId) {
      form.setValue('zoneId', '', { shouldValidate: false });
    }
    prevCityRef.current = selectedCityId;
  }, [selectedCityId, form]);
  const selectedServiceIds = form.watch('serviceTypeIds') ?? [];
  // Mirror the backend rule: ambulance number is required iff the AMBULANCE
  // service is among the selected ones. We look up the code so the trigger
  // doesn't break if the service ID shifts between environments.
  const needsAmbulanceNumber = services.some(
    (s) => s.code === 'AMBULANCE' && selectedServiceIds.includes(s.id),
  );

  const toggleService = (id: string): void => {
    const next = selectedServiceIds.includes(id)
      ? selectedServiceIds.filter((s) => s !== id)
      : [...selectedServiceIds, id];
    form.setValue('serviceTypeIds', next, { shouldValidate: true });
  };

  const onSubmit = async (values: CompleteProfileFormValues): Promise<void> => {
    // Client-side mirror of the backend rule — short-circuit so the staff
    // sees the error inline instead of as a server toast.
    if (needsAmbulanceNumber && !values.ambulanceNumber) {
      form.setError('ambulanceNumber', {
        type: 'manual',
        message: 'Ambulance number is required when offering ambulance service',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend treats empty strings as invalid for optional fields — strip
      // them so the request omits the key entirely instead.
      const isOtherZone = values.zoneId === 'OTHER';
      const payload = {
        cityId: values.cityId,
        cnic: values.cnic,
        experienceYears: values.experienceYears,
        serviceTypeIds: values.serviceTypeIds,
        ...(isOtherZone
          ? { customZoneName: values.customZoneName?.trim() }
          : values.zoneId
          ? { zoneId: values.zoneId }
          : {}),
        ...(values.gender ? { gender: values.gender } : {}),
        ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
        ...(values.ambulanceNumber ? { ambulanceNumber: values.ambulanceNumber } : {}),
      };
      await api.patch(API.STAFF.MY_PROFILE, payload);
      toast.success('Profile saved — upload your documents next');
      navigate('/staff/documents', { replace: true });
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
    needsAmbulanceNumber,
  };
}
