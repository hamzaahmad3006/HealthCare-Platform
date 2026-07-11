import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SelectPackage } from './SelectPackage';
import { Step2PatientAddress } from './Step2PatientAddress';
import { Step3DateTime } from './Step3DateTime';
import { Step4Confirm } from './Step4Confirm';
import { useNewBooking, type BookingDraft } from './useNewBooking';
import type { CustomerStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<CustomerStackParamList, 'NewBooking'>;

const todayISO = (): string => new Date().toISOString().slice(0, 10);

export function NewBookingWizard(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const { packages, patients, addresses, loading, submitting, reload, createBooking } = useNewBooking();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>({
    packageId: null, serviceTypeId: null, patientId: null, addressId: null, cityId: null,
    date: todayISO(), time: '10:00', urgency: 'NORMAL', gender: '', instructions: '',
  });

  // Re-pull reference data when returning to the wizard (e.g. after adding a patient).
  useEffect(() => navigation.addListener('focus', () => { reload(); }), [navigation, reload]);

  const patch = (p: Partial<BookingDraft>): void => setDraft((prev) => ({ ...prev, ...p }));

  const selectedPackage = packages.find((p) => p.id === draft.packageId) ?? null;
  const selectedPatient = patients.find((p) => p.id === draft.patientId) ?? null;
  const selectedAddress = addresses.find((a) => a.id === draft.addressId) ?? null;

  const handleConfirm = async (): Promise<void> => {
    try {
      const id = await createBooking(draft);
      navigation.reset({
        index: 1,
        routes: [{ name: 'Tabs' }, { name: 'BookingDetail', params: { id } }],
      });
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  if (step === 1) {
    return (
      <SelectPackage
        packages={packages}
        loading={loading}
        selectedId={draft.packageId}
        onSelect={(pkg) => patch({ packageId: pkg.id, serviceTypeId: pkg.serviceTypeId })}
        onBack={() => navigation.goBack()}
        onNext={() => setStep(2)}
      />
    );
  }

  if (step === 2) {
    return (
      <Step2PatientAddress
        patients={patients}
        addresses={addresses}
        loading={loading}
        patientId={draft.patientId}
        addressId={draft.addressId}
        onSelectPatient={(id) => patch({ patientId: id })}
        onSelectAddress={(a) => patch({ addressId: a.id, cityId: a.cityId })}
        onAddPatient={() => navigation.navigate('MyPatients')}
        onAddAddress={() =>
          Alert.alert('Add address', 'Please add a service address from your Account tab first.')
        }
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    );
  }

  if (step === 3) {
    return (
      <Step3DateTime
        date={draft.date}
        time={draft.time}
        urgency={draft.urgency}
        gender={draft.gender}
        instructions={draft.instructions}
        onChange={patch}
        onBack={() => setStep(2)}
        onNext={() => setStep(4)}
      />
    );
  }

  const priceText = selectedPackage
    ? `${selectedPackage.currency} ${Number(selectedPackage.priceAmount).toLocaleString('en-PK')}`
    : '—';

  return (
    <Step4Confirm
      submitting={submitting}
      onBack={() => setStep(3)}
      onConfirm={handleConfirm}
      summary={{
        service: selectedPackage?.serviceTypeName ?? '—',
        package: selectedPackage
          ? `${selectedPackage.name} · ${selectedPackage.visitCount} visits / ${selectedPackage.durationDays} days`
          : '—',
        price: priceText,
        patient: selectedPatient?.fullName ?? '—',
        address: selectedAddress ? `${selectedAddress.line1}, ${selectedAddress.area}` : '—',
        date: draft.date,
        time: draft.time,
        urgency: draft.urgency.charAt(0) + draft.urgency.slice(1).toLowerCase(),
        gender: draft.gender || 'No preference',
        instructions: draft.instructions.trim() || '—',
      }}
    />
  );
}
