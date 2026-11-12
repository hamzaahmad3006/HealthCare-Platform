import { useEffect, useState, type JSX } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { api, extractApiError } from '../api/client';
import { API } from '../api/endpoints';
import type { DoctorOption } from '../types/doctorBooking.types';
import { Colors, Spacing, Radius } from '../constants/theme';

export function DoctorPicker({
  cityId,
  selectedId,
  onSelect,
}: {
  cityId: string;
  selectedId?: string | null;
  onSelect: (doctor: DoctorOption | null) => void;
}): JSX.Element {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDoctors([]);
    api
      .get<{ data: DoctorOption[] }>(`${API.STAFF.DOCTORS}?cityId=${encodeURIComponent(cityId)}`)
      .then(({ data }) => {
        if (active) setDoctors(data.data);
      })
      .catch(err => {
        if (active) setError(extractApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cityId, retry]);
  useEffect(() => {
    if (!loading && !error && selectedId && !doctors.some(doctor => doctor.userId === selectedId))
      onSelect(null);
  }, [doctors, loading, error, selectedId, onSelect]);
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Preferred doctor (optional)</Text>
      <Text style={styles.body}>
        Select a verified doctor in your service city, or let admin assign one.
      </Text>
      <Pressable
        accessibilityRole="button"
        style={[styles.option, !selectedId && styles.selected]}
        onPress={() => onSelect(null)}
      >
        <Text style={styles.body}>Let admin assign a doctor</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading doctors" color={Colors.primary} />
      ) : error ? (
        <View>
          <Text accessibilityRole="alert">{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => setRetry(n => n + 1)}>
            <Text style={styles.body}>Retry doctors</Text>
          </Pressable>
        </View>
      ) : doctors.length === 0 ? (
        <Text style={styles.body}>No eligible doctors available in this city right now.</Text>
      ) : (
        doctors.map(doctor => (
          <Pressable
            accessibilityRole="button"
            key={doctor.userId}
            style={[styles.option, selectedId === doctor.userId && styles.selected]}
            onPress={() => onSelect(doctor)}
          >
            <Text style={styles.title}>{doctor.user.fullName}</Text>
            <Text style={styles.body}>
              {doctor.experienceYears} years experience · Verified doctor
            </Text>
          </Pressable>
        ))
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  body: { color: Colors.textSecondary },
  box: { gap: Spacing.sm },
  title: { fontWeight: '700', color: Colors.textPrimary },
  option: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
  },
  selected: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
});
