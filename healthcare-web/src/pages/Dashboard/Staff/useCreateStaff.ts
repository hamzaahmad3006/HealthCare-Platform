import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
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
  isConverted?: boolean;
}

export interface CustomerMatch {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
}

export interface CustomerSearchResult {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  createdAt: string;
  _count?: { bookings: number; patients: number };
}

interface UseCreateStaffReturn {
  form: ReturnType<typeof useForm<CreateStaffFormValues>>;
  onSubmit: (values: CreateStaffFormValues) => Promise<void>;
  isSubmitting: boolean;
  result: CreateStaffSuccess | null;
  resetResult: () => void;

  // Conversion of existing customer
  customerMatch: CustomerMatch | null;
  clearCustomerMatch: () => void;
  convertCustomer: (userId: string) => Promise<void>;
  convertingCustomerId: string | null;
  promotedCustomerIds: Record<string, boolean>;

  // Dedicated Tab and Search
  activeTab: 'invite' | 'convert';
  setActiveTab: (tab: 'invite' | 'convert') => void;
  customerSearchQuery: string;
  setCustomerSearchQuery: (q: string) => void;
  isSearching: boolean;
  customerSearchResults: CustomerSearchResult[];
  searchCustomers: (query?: string) => Promise<void>;
}

export function useCreateStaff(): UseCreateStaffReturn {
  const [activeTab, setActiveTab] = useState<'invite' | 'convert'>('invite');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertingCustomerId, setConvertingCustomerId] = useState<string | null>(null);
  const [promotedCustomerIds, setPromotedCustomerIds] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<CreateStaffSuccess | null>(null);
  const [customerMatch, setCustomerMatch] = useState<CustomerMatch | null>(null);

  // Search state for convert tab
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerSearchResult[]>([]);

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { fullName: '', phone: '', email: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (values: CreateStaffFormValues): Promise<void> => {
    setIsSubmitting(true);
    setCustomerMatch(null);
    try {
      const { data } = await api.post<{ success: true; data: CreateStaffSuccess }>(
        API.STAFF.LIST,
        { ...values, phone: toE164(values.phone) },
      );
      setResult(data.data);
      form.reset();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const resData = err.response.data as {
          code?: string;
          error?: { code?: string };
          data?: CustomerMatch;
        };
        const code = resData.code || resData.error?.code;
        if (code === 'CUSTOMER_EXISTS' && resData.data) {
          setCustomerMatch(resData.data);
          toast(
            `User registered as Customer: ${resData.data.fullName}. Click Promote to convert them.`,
            { icon: 'ℹ️' }
          );
          return;
        }
      }
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertCustomer = async (userId: string): Promise<void> => {
    setIsSubmitting(true);
    setConvertingCustomerId(userId);
    try {
      const { data } = await api.post<{ success: true; data: CreateStaffSuccess }>(
        API.STAFF.CONVERT_CUSTOMER,
        { userId },
      );
      setPromotedCustomerIds((prev) => ({ ...prev, [userId]: true }));
      setResult({ ...data.data, isConverted: true });
      setCustomerMatch(null);
      form.reset();
      toast.success('Customer promoted to Staff & invite dispatched!');
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
      setConvertingCustomerId(null);
    }
  };

  const searchCustomers = useCallback(async (query?: string): Promise<void> => {
    const q = (query ?? customerSearchQuery).trim();
    setIsSearching(true);
    try {
      const { data } = await api.get<{
        success: true;
        data: CustomerSearchResult[];
      }>(API.ADMIN.CUSTOMERS, {
        params: { search: q || undefined, limit: 10 },
      });
      setCustomerSearchResults(data.data);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSearching(false);
    }
  }, [customerSearchQuery]);

  return {
    form,
    onSubmit,
    isSubmitting,
    result,
    resetResult: () => {
      setResult(null);
      setCustomerMatch(null);
    },
    customerMatch,
    clearCustomerMatch: () => setCustomerMatch(null),
    convertCustomer,
    convertingCustomerId,
    promotedCustomerIds,
    activeTab,
    setActiveTab,
    customerSearchQuery,
    setCustomerSearchQuery,
    isSearching,
    customerSearchResults,
    searchCustomers,
  };
}
