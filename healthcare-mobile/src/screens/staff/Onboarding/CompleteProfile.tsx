import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StaffStackParamList } from '../../../navigation/types';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type {
  StaffOnboardingProfile,
  StaffProfileDraft,
  ServiceOption,
  CityOption,
} from '../../../types/staffOnboarding.types';
import { staffProfilePayload } from '../../../utils/staffOnboarding';
import { useStaffAccess } from './StaffAccess';
import {
  FlowForm,
  FlowInput,
  FlowButton,
  FlowError,
  flowStyles,
} from '../../../components/FlowForm';

export function CompleteProfile() {
  const navigation =
    useNavigation<NativeStackNavigationProp<StaffStackParamList>>();
  const { refresh } = useStaffAccess();
  const [services, setServices] = useState<ServiceOption[]>([]),
    [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [draft, setDraft] = useState<StaffProfileDraft>({
    cityId: '',
    zoneId: '',
    cnic: '',
    gender: '',
    dateOfBirth: '',
    experienceYears: '0',
    ambulanceNumber: '',
    serviceTypeIds: [],
  });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    Promise.all([
      api.get<{ data: StaffOnboardingProfile }>(API.STAFF.ME),
      api.get<{ data: ServiceOption[] }>(API.SERVICE_TYPES),
      api.get<{ data: CityOption[] }>(API.CITIES),
    ])
      .then(([profile, serviceResponse, cityResponse]) => {
        if (!active) return;
        const p = profile.data.data;
        setServices(serviceResponse.data.data);
        setCities(cityResponse.data.data);
        setDraft({
          cityId: p.cityId ?? '',
          zoneId: p.zoneId ?? '',
          cnic: p.cnic ?? '',
          gender: p.gender ?? '',
          dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? '',
          experienceYears: String(p.experienceYears),
          ambulanceNumber: p.ambulanceNumber ?? '',
          serviceTypeIds: p.serviceTypes.map(s => s.serviceType.id),
        });
      })
      .catch(err => {
        if (active) setLoadError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  const patch = useCallback(
    (value: Partial<StaffProfileDraft>) =>
      setDraft(prev => ({ ...prev, ...value })),
    [],
  );
  const submit = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const payload = staffProfilePayload(draft, services, cities);
      await api.patch(API.STAFF.MY_PROFILE, payload);
      await refresh();
      navigation.replace('StaffDocuments');
    } catch (err) {
      setError(
        err instanceof Error && !('response' in err)
          ? err.message
          : extractApiError(err),
      );
    } finally {
      setBusy(false);
    }
  };
  const option = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      disabled={busy}
      style={[flowStyles.option, selected && flowStyles.selected]}
      onPress={onPress}
    >
      <Text style={flowStyles.body}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </Pressable>
  );
  if (loading)
    return (
      <FlowForm title="Complete profile">
        <ActivityIndicator accessibilityLabel="Loading profile options" />
      </FlowForm>
    );
  if (loadError)
    return (
      <FlowForm title="Complete profile">
        <FlowError message={loadError} />
        <FlowButton
          title="Retry profile options"
          onPress={() => setRetry(n => n + 1)}
        />
      </FlowForm>
    );
  return (
    <FlowForm title="Complete profile">
      <Text style={flowStyles.body}>
        Changes to verification details require admin review before you can
        work.
      </Text>
      <Text style={flowStyles.label}>Service city</Text>
      {cities.length ? (
        cities.map(c =>
          option(c.name, draft.cityId === c.id, () =>
            patch({ cityId: c.id, zoneId: '' }),
          ),
        )
      ) : (
        <Text style={flowStyles.body}>No cities available. Contact admin.</Text>
      )}
      <Text style={flowStyles.label}>Zone (optional)</Text>
      {option('No zone', !draft.zoneId, () => patch({ zoneId: '' }))}
      {(cities.find(c => c.id === draft.cityId)?.zones ?? []).map(z =>
        option(z.name, draft.zoneId === z.id, () => patch({ zoneId: z.id })),
      )}
      <FlowInput
        label="CNIC"
        value={draft.cnic}
        onChangeText={cnic => patch({ cnic })}
        editable={!busy}
        keyboardType="number-pad"
        placeholder="13 digits, with or without dashes"
      />
      <Text style={flowStyles.label}>Gender (optional)</Text>
      {['', 'MALE', 'FEMALE', 'OTHER'].map(g =>
        option(g || 'Not specified', draft.gender === g, () =>
          patch({ gender: g }),
        ),
      )}
      <FlowInput
        label="Date of birth (optional)"
        placeholder="YYYY-MM-DD"
        value={draft.dateOfBirth}
        onChangeText={dateOfBirth => patch({ dateOfBirth })}
        editable={!busy}
      />
      <FlowInput
        label="Years of experience"
        keyboardType="number-pad"
        value={draft.experienceYears}
        onChangeText={experienceYears => patch({ experienceYears })}
        editable={!busy}
      />
      <Text style={flowStyles.label}>Services</Text>
      {services.length ? (
        services.map(s =>
          option(s.name, draft.serviceTypeIds.includes(s.id), () =>
            patch({
              serviceTypeIds: draft.serviceTypeIds.includes(s.id)
                ? draft.serviceTypeIds.filter(id => id !== s.id)
                : [...draft.serviceTypeIds, s.id],
            }),
          ),
        )
      ) : (
        <Text style={flowStyles.body}>
          No services available. Contact admin.
        </Text>
      )}
      {services.some(
        s => s.code === 'AMBULANCE' && draft.serviceTypeIds.includes(s.id),
      ) ? (
        <FlowInput
          label="Ambulance registration number"
          value={draft.ambulanceNumber}
          onChangeText={ambulanceNumber => patch({ ambulanceNumber })}
          editable={!busy}
        />
      ) : null}
      <FlowError message={error} />
      <FlowButton
        title="Save profile and continue"
        loading={busy}
        onPress={() => {
          void submit();
        }}
      />
    </FlowForm>
  );
}
