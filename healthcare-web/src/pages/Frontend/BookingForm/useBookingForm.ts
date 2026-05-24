import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type {
  ServiceType,
  Package,
  Patient,
  Address,
  CreateBookingRequest,
  Booking,
  UrgencyLevel,
  Gender,
  Doctor,
} from '../../../types/booking.types';

export type StepNumber = 1 | 2 | 3 | 4;

interface UseBookingFormReturn {
  // Step + nav
  currentStep: StepNumber;
  goNext: () => void;
  goBack: () => void;
  goToStep: (s: StepNumber) => void;

  // Step 1
  services: ServiceType[];
  packages: Package[];
  doctors: Doctor[];
  isLoadingDoctors: boolean;
  selectedServiceId: string | null;
  selectedPackageId: string | null;
  selectedDoctorId: string | null;
  selectService: (id: string) => void;
  selectPackage: (id: string) => void;
  selectDoctor: (id: string | null) => void;
  isVisitingDoctorService: boolean;

  // Step 2
  patients: Patient[];
  addresses: Address[];
  selectedPatientId: string | null;
  selectedAddressId: string | null;
  selectPatient: (id: string) => void;
  selectAddress: (id: string) => void;
  addPatient: (p: Patient) => void;
  addAddress: (a: Address) => void;
  updatePatient: (p: Patient) => void;
  removePatient: (id: string) => void;
  updateAddress: (a: Address) => void;
  removeAddress: (id: string) => void;

  // Step 3
  requestedDate: string;
  requestedTime: string;
  urgencyLevel: UrgencyLevel;
  preferredGender: Gender | '';
  specialInstructions: string;
  setRequestedDate: (v: string) => void;
  setRequestedTime: (v: string) => void;
  setUrgencyLevel: (v: UrgencyLevel) => void;
  setPreferredGender: (v: Gender | '') => void;
  setSpecialInstructions: (v: string) => void;

  // Summary derivations
  selectedService: ServiceType | null;
  selectedPackage: Package | null;
  selectedPatient: Patient | null;
  selectedAddress: Address | null;

  // Submission
  isLoadingInitial: boolean;
  isLoadingPackages: boolean;
  isSubmitting: boolean;
  stepError: string | null;
  submit: () => Promise<void>;
  canProceed: boolean;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useBookingForm(): UseBookingFormReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCode = searchParams.get('service');

  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Step 1 state
  const [services, setServices] = useState<ServiceType[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  // Step 2 state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Step 3 state
  const [requestedDate, setRequestedDate] = useState<string>(todayISODate());
  const [requestedTime, setRequestedTime] = useState<string>('10:00');
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('NORMAL');
  const [preferredGender, setPreferredGender] = useState<Gender | ''>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Async + error state
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // One idempotency key per form session — prevents double-booking on retry.
  const [idempotencyKey] = useState<string>(() => uuidv4());

  // ── Initial load: services, patients, addresses ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [svcRes, patientsRes, addrRes] = await Promise.all([
          api.get<{ success: true; data: ServiceType[] }>(API.SERVICE_TYPES),
          api
            .get<{ success: true; data: Patient[] }>(API.USERS.PATIENTS)
            .catch(() => ({ data: { success: true as const, data: [] as Patient[] } })),
          api
            .get<{ success: true; data: Address[] }>(API.USERS.ADDRESSES)
            .catch(() => ({ data: { success: true as const, data: [] as Address[] } })),
        ]);
        if (cancelled) return;
        const active = svcRes.data.data.filter((s) => s.isActive);
        setServices(active);
        setPatients(patientsRes.data.data);
        setAddresses(addrRes.data.data);

        // Preselect from URL param if present
        if (preselectedCode) {
          const match = active.find((s) => s.code === preselectedCode);
          if (match) setSelectedServiceId(match.id);
        }
      } catch (err) {
        if (!cancelled) setStepError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoadingInitial(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [preselectedCode]);

  // ── Load packages when service changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedServiceId) {
      setPackages([]);
      setSelectedPackageId(null);
      return;
    }
    let cancelled = false;
    setIsLoadingPackages(true);
    setSelectedPackageId(null);
    const load = async (): Promise<void> => {
      try {
        const { data } = await api.get<{ success: true; data: Package[] }>(
          `${API.PACKAGES}?serviceTypeId=${selectedServiceId}&isActive=true`,
        );
        if (!cancelled) setPackages(data.data.filter((p) => p.isActive));
      } catch (err) {
        if (!cancelled) setStepError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoadingPackages(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedServiceId]);

  const isVisitingDoctorService = useMemo(
    () => services.find((s) => s.id === selectedServiceId)?.code === 'VISITING_DOCTOR',
    [services, selectedServiceId],
  );

  // ── Load doctors when VISITING_DOCTOR service is selected ─────────────────
  useEffect(() => {
    if (!isVisitingDoctorService) {
      setDoctors([]);
      setSelectedDoctorId(null);
      return;
    }
    let cancelled = false;
    setIsLoadingDoctors(true);
    const load = async (): Promise<void> => {
      try {
        const { data } = await api.get<{ success: true; data: Doctor[] }>(API.STAFF.DOCTORS);
        if (!cancelled) setDoctors(data.data);
      } catch {
        // non-fatal — doctor selection is optional
      } finally {
        if (!cancelled) setIsLoadingDoctors(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isVisitingDoctorService]);

  // ── Derived selections ─────────────────────────────────────────────────────
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  );
  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );
  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    if (currentStep === 1) return Boolean(selectedServiceId && selectedPackageId);
    if (currentStep === 2) return Boolean(selectedPatientId && selectedAddressId);
    if (currentStep === 3) return Boolean(requestedDate && requestedTime);
    return true;
  }, [currentStep, selectedServiceId, selectedPackageId, selectedPatientId, selectedAddressId, requestedDate, requestedTime]);

  const goNext = useCallback(() => {
    setStepError(null);
    if (!canProceed) {
      setStepError('Please complete the required fields before continuing.');
      return;
    }
    setCurrentStep((s) => (s < 4 ? ((s + 1) as StepNumber) : s));
  }, [canProceed]);

  const goBack = useCallback(() => {
    setStepError(null);
    setCurrentStep((s) => (s > 1 ? ((s - 1) as StepNumber) : s));
  }, []);

  const goToStep = useCallback((s: StepNumber) => {
    setStepError(null);
    setCurrentStep(s);
  }, []);

  const addPatient = useCallback((p: Patient) => {
    setPatients((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    setSelectedPatientId(p.id);
  }, []);

  const addAddress = useCallback((a: Address) => {
    setAddresses((prev) => [a, ...prev.filter((x) => x.id !== a.id)]);
    setSelectedAddressId(a.id);
  }, []);

  const updatePatient = useCallback((p: Patient) => {
    setPatients((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  }, []);

  const removePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((x) => x.id !== id));
    setSelectedPatientId((prev) => (prev === id ? null : prev));
  }, []);

  const updateAddress = useCallback((a: Address) => {
    setAddresses((prev) => prev.map((x) => (x.id === a.id ? a : x)));
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((x) => x.id !== id));
    setSelectedAddressId((prev) => (prev === id ? null : prev));
  }, []);

  // ── Submission ─────────────────────────────────────────────────────────────
  const submit = useCallback(async (): Promise<void> => {
    if (!selectedService || !selectedPackage || !selectedPatient || !selectedAddress) {
      setStepError('Please complete all steps before confirming.');
      return;
    }
    setIsSubmitting(true);
    setStepError(null);
    try {
      const requestedStartAt = new Date(`${requestedDate}T${requestedTime}:00`).toISOString();
      const payload: CreateBookingRequest = {
        patientId: selectedPatient.id,
        serviceTypeId: selectedService.id,
        packageId: selectedPackage.id,
        addressId: selectedAddress.id,
        cityId: selectedAddress.cityId,
        requestedStartAt,
        urgencyLevel,
        source: 'WEB',
      };
      if (preferredGender) payload.preferredStaffGender = preferredGender;
      if (selectedDoctorId && isVisitingDoctorService) payload.preferredDoctorUserId = selectedDoctorId;
      if (specialInstructions.trim()) payload.specialInstructions = specialInstructions.trim();

      const { data } = await api.post<{ success: true; data: Booking }>(API.BOOKINGS.LIST, payload, {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });

      toast.success(`Booking ${data.data.bookingNumber} created! We'll confirm shortly.`);
      navigate(`/my-bookings/${data.data.id}`, { replace: true });
    } catch (err) {
      setStepError(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedService,
    selectedPackage,
    selectedPatient,
    selectedAddress,
    requestedDate,
    requestedTime,
    urgencyLevel,
    preferredGender,
    specialInstructions,
    selectedDoctorId,
    isVisitingDoctorService,
    idempotencyKey,
    navigate,
  ]);

  return {
    currentStep,
    goNext,
    goBack,
    goToStep,
    services,
    packages,
    doctors,
    isLoadingDoctors,
    selectedServiceId,
    selectedPackageId,
    selectedDoctorId,
    selectService: setSelectedServiceId,
    selectPackage: setSelectedPackageId,
    selectDoctor: setSelectedDoctorId,
    isVisitingDoctorService,
    patients,
    addresses,
    selectedPatientId,
    selectedAddressId,
    selectPatient: setSelectedPatientId,
    selectAddress: setSelectedAddressId,
    addPatient,
    addAddress,
    updatePatient,
    removePatient,
    updateAddress,
    removeAddress,
    requestedDate,
    requestedTime,
    urgencyLevel,
    preferredGender,
    specialInstructions,
    setRequestedDate,
    setRequestedTime,
    setUrgencyLevel,
    setPreferredGender,
    setSpecialInstructions,
    selectedService,
    selectedPackage,
    selectedPatient,
    selectedAddress,
    isLoadingInitial,
    isLoadingPackages,
    isSubmitting,
    stepError,
    submit,
    canProceed,
  };
}
