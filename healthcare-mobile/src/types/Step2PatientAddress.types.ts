import type { PatientOption, AddressOption } from './useNewBooking.types';

export interface Props {
  patients: PatientOption[];
  addresses: AddressOption[];
  loading: boolean;
  patientId: string | null;
  addressId: string | null;
  onSelectPatient: (id: string) => void;
  onSelectAddress: (addr: AddressOption) => void;
  onAddPatient?: () => void;
  onAddAddress?: () => void;
  onBack?: () => void;
  onNext?: () => void;
}
