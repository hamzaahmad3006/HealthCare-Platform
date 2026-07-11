import { useCallback, useEffect, useState } from 'react';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';

export type Urgency = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type Gender = '' | 'MALE' | 'FEMALE';

export interface PackageOption {
  id: string;
  serviceTypeId: string;
  serviceTypeName: string;
  name: string;
  packageType: string;
  durationDays: number;
  visitCount: number;
  priceAmount: string;
  currency: string;
}

export interface PatientOption {
  id: string;
  fullName: string;
  relationshipToCustomer?: string;
}

export interface AddressOption {
  id: string;
  cityId: string;
  label?: string | null;
  line1: string;
  area: string;
  contactPhone: string;
}

export interface BookingDraft {
  packageId: string | null;
  serviceTypeId: string | null;
  patientId: string | null;
  addressId: string | null;
  cityId: string | null;
  date: string;
  time: string;
  urgency: Urgency;
  gender: Gender;
  instructions: string;
}

interface ApiServiceType { id: string; name: string }
interface ApiPackage {
  id: string; serviceTypeId: string; name: string; packageType: string;
  durationDays: number; visitCount: number; priceAmount: string; currency: string;
}
interface ApiPatient { id: string; fullName: string; relationshipToCustomer?: string | null }
interface ApiAddress {
  id: string; cityId: string; label?: string | null; line1: string; area: string; contactPhone: string;
}

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

      const svcNameById = new Map(svcRes.data.data.map((s) => [s.id, s.name]));
      setPackages(
        pkgRes.data.data.map((p) => ({
          id: p.id,
          serviceTypeId: p.serviceTypeId,
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
    if (!draft.packageId || !draft.serviceTypeId || !draft.patientId || !draft.addressId || !draft.cityId) {
      throw new Error('Please complete all steps before confirming.');
    }
    const startsAt = new Date(`${draft.date}T${draft.time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      throw new Error('Please enter a valid date and time.');
    }

    const payload: Record<string, unknown> = {
      patientId: draft.patientId,
      serviceTypeId: draft.serviceTypeId,
      packageId: draft.packageId,
      addressId: draft.addressId,
      cityId: draft.cityId,
      requestedStartAt: startsAt.toISOString(),
      urgencyLevel: draft.urgency,
      source: 'MOBILE',
    };
    if (draft.gender) payload.preferredStaffGender = draft.gender;
    if (draft.instructions.trim()) payload.specialInstructions = draft.instructions.trim();

    setSubmitting(true);
    try {
      const { data } = await api.post<{ success: true; data: { id: string } }>(
        API.BOOKINGS.CREATE,
        payload,
        { headers: { 'X-Idempotency-Key': idempotencyKey() } },
      );
      return data.data.id;
    } catch (err) {
      throw new Error(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return { packages, patients, addresses, loading, error, submitting, reload: load, createBooking };
}
