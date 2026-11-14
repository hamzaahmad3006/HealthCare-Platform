import { useCallback, useEffect, useState, useRef } from 'react';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type {
  PackageOption, PatientOption, AddressOption, BookingDraft,
  ApiServiceType, ApiPackage, ApiPatient, ApiAddress,
} from '../../../types/useNewBooking.types';

import { newBookingPayload } from '../../../utils/doctorBooking';

// Monotonic-ish unique key for idempotency (RN has no crypto.randomUUID guarantee).
let seq = 0;
function idempotencyKey(): string {
  seq += 1;
  return `mbk-${Date.now()}-${seq}-${Math.floor(Math.random() * 1e9)}`;
}

export function useNewBooking() {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef<{ signature: string; promise: Promise<string> } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, pkgRes, patRes, addrRes] = await Promise.all([
        api.get<{ success: true; data: ApiServiceType[] }>(API.SERVICE_TYPES),
        api.get<{ success: true; data: ApiPackage[] }>(`${API.PACKAGES}?isActive=true`),
        api.get<{ success: true; data: ApiPatient[] }>(API.PATIENTS.LIST),
        api.get<{ success: true; data: ApiAddress[] }>(API.ADDRESSES.LIST),
      ]);

      const svcCodeById = new Map(svcRes.data.data.map(s => [s.id, s.code]));
      const svcNameById = new Map(svcRes.data.data.map((s) => [s.id, s.name]));
      setPackages(
        pkgRes.data.data.map((p) => ({
          id: p.id,
          serviceTypeId: p.serviceTypeId,
          serviceTypeCode: svcCodeById.get(p.serviceTypeId) ?? '',
          serviceTypeName: svcNameById.get(p.serviceTypeId) ?? 'Service',
          name: p.name,
          packageType: p.packageType,
          durationDays: p.durationDays,
          visitCount: p.visitCount,
          priceAmount: p.priceAmount,
          currency: p.currency,
        })),
      );
      setPatients(
        patRes.data.data.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          relationshipToCustomer: p.relationshipToCustomer ?? undefined,
        })),
      );
      setAddresses(
        addrRes.data.data.map((a) => ({
          id: a.id,
          cityId: a.cityId,
          label: a.label,
          line1: a.line1,
          area: a.area,
          contactPhone: a.contactPhone,
        })),
      );
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Returns the new booking id, or throws with a user-facing message.
  const createBooking = async (draft: BookingDraft): Promise<string> => {
    const pkg = packages.find(p => p.id === draft.packageId);
    const payload = newBookingPayload(draft, pkg?.serviceTypeCode === 'VISITING_DOCTOR');

    const signature = JSON.stringify(payload);
    if (inFlight.current) {
      if (inFlight.current.signature === signature) return inFlight.current.promise;
      throw new Error('Please wait for the current booking request to finish.');
    }
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: idempotencyKey() };
    }
    const key = attempt.current.key;
    setSubmitting(true);
    const promise = (async () => {
      try {
        const { data } = await api.post<{ success: true; data: { id: string } }>(
          API.BOOKINGS.CREATE, payload, { headers: { 'X-Idempotency-Key': key } },
        );
        return data.data.id;
      } catch (err) {
        throw new Error(extractApiError(err));
      } finally {
        inFlight.current = null;
        setSubmitting(false);
      }
    })();
    inFlight.current = { signature, promise };
    return promise;
  };

  return { packages, patients, addresses, loading, error, submitting, reload: load, createBooking };
}
