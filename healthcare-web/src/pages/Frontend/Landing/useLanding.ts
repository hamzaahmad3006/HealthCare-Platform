import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { ServiceType } from '../../../types/booking.types';

interface UseLandingReturn {
  services: ServiceType[];
  isLoading: boolean;
  error: string | null;
  handleBookNow: (serviceCode?: string) => void;
  handleWhatsApp: () => void;
}

export function useLanding(): UseLandingReturn {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const { data } = await api.get<{ success: true; data: ServiceType[] }>(API.SERVICE_TYPES);
        if (!cancelled) setServices(data.data.filter((s) => s.isActive));
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBookNow = (serviceCode?: string): void => {
    if (serviceCode) navigate(`/book?service=${encodeURIComponent(serviceCode)}`);
    else navigate('/book');
  };

  const handleWhatsApp = (): void => {
    const phone = (import.meta.env['VITE_WHATSAPP_NUMBER'] as string | undefined) ?? '+923001234567';
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  return { services, isLoading, error, handleBookNow, handleWhatsApp };
}
