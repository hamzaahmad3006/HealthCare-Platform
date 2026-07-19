import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppSelector } from '../../../store';
import type { ApiVisit } from '../../../types/visit.types';
import type { BookingDetail } from '../../../types/booking.types';
import { serviceLabelFromCode, startOfDayISO, endOfDayISO } from '../../../utils/format';

const ACTIVE_STATUSES = ['SCHEDULED', 'ASSIGNED', 'EN_ROUTE', 'CHECKED_IN'];

export interface NextPatientInfo {
  visitId: string;
  patientName: string;
  serviceLabel: string;
  scheduledStartAt: string;
  addressLine: string | null;
  addressCity: string | null;
}

export interface LaterVisit {
  id: string;
  patientName: string;
  serviceLabel: string;
  scheduledStartAt: string;
}

export function useStaffHome() {
  const user = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextPatient, setNextPatient] = useState<NextPatientInfo | null>(null);
  const [laterToday, setLaterToday] = useState<LaterVisit[]>([]);
  const [available, setAvailable] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [staffCode, setStaffCode] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const [visitsRes, profileRes] = await Promise.all([
        api.get<{ success: true; data: ApiVisit[] }>(API.VISITS.LIST, {
          params: { fromDate: startOfDayISO(), toDate: endOfDayISO(), limit: 100 },
        }),
        api.get<{ success: true; data: { staffCode: string; isAvailable: boolean } }>(API.STAFF.ME).catch(() => null),
      ]);

      if (profileRes) {
        setStaffCode(profileRes.data.data.staffCode);
        setAvailable(profileRes.data.data.isAvailable);
      }

      const visits = visitsRes.data.data;
      setTodayCount(visits.length);
      setCompletedCount(visits.filter((v) => v.status === 'COMPLETED').length);

      const active = visits
        .filter((v) => ACTIVE_STATUSES.includes(v.status))
        .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());

      const patientIds = Array.from(new Set(active.map((v) => v.booking.patientId)));
      let nameById = new Map<string, string>();
      if (patientIds.length > 0) {
        try {
          const { data: patientsRes } = await api.get<{ success: true; data: { id: string; fullName: string }[] }>(
            API.PATIENTS.LIST,
          );
          nameById = new Map(patientsRes.data.map((p) => [p.id, p.fullName]));
        } catch {
          // Non-critical — falls back to booking numbers below.
        }
      }

      const [head, ...rest] = active;
      if (head) {
        let addressLine: string | null = null;
        let addressCity: string | null = null;
        try {
          const { data: bookingRes } = await api.get<{ success: true; data: BookingDetail }>(
            API.BOOKINGS.DETAIL(head.bookingId),
          );
          if (bookingRes.data.address) {
            addressLine = bookingRes.data.address.line1;
            addressCity = bookingRes.data.city
              ? `${bookingRes.data.address.area}, ${bookingRes.data.city.name}`
              : bookingRes.data.address.area;
          }
        } catch {
          // Non-critical — card just omits the address.
        }
        setNextPatient({
          visitId: head.id,
          patientName: nameById.get(head.booking.patientId) ?? head.booking.bookingNumber,
          serviceLabel: serviceLabelFromCode(head.booking.serviceType.code),
          scheduledStartAt: head.scheduledStartAt,
          addressLine,
          addressCity,
        });
      } else {
        setNextPatient(null);
      }

      setLaterToday(
        rest.map((v) => ({
          id: v.id,
          patientName: nameById.get(v.booking.patientId) ?? v.booking.bookingNumber,
          serviceLabel: serviceLabelFromCode(v.booking.serviceType.code),
          scheduledStartAt: v.scheduledStartAt,
        })),
      );
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      setTodayCount(0);
      setCompletedCount(0);
      setNextPatient(null);
      setLaterToday([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleDuty = async (): Promise<void> => {
    if (!user || togglingDuty) return;
    setTogglingDuty(true);
    try {
      const { data } = await api.patch<{ success: true; data: { isAvailable: boolean } }>(
        API.STAFF.AVAILABILITY(user.id),
      );
      setAvailable(data.data.isAvailable);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setTogglingDuty(false);
    }
  };

  return {
    loading,
    todayCount,
    completedCount,
    nextPatient,
    laterToday,
    available,
    togglingDuty,
    toggleDuty,
    staffCode,
    fullName: user?.fullName ?? 'Staff Member',
  };
}
