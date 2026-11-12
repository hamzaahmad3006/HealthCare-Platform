import { useCallback, useRef, useState, type JSX } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { acceptDoctorRequest, proposeDoctorTime } from '../../../api/doctorBooking';
import { localDateValue } from '../../../utils/doctorBooking';
import type { DoctorRequest } from '../../../types/doctorBooking.types';
import type { RouteProp } from '@react-navigation/native';
import type { StaffStackParamList } from '../../../navigation/types';
import { Colors, Spacing, Radius } from '../../../constants/theme';

export function DoctorRequests(): JSX.Element {
  const route = useRoute<RouteProp<StaffStackParamList, 'DoctorRequests'>>();
  const refreshKey = route.params?.refreshKey;
  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [eligible, setEligible] = useState(false),
    [page, setPage] = useState(1),
    [hasNext, setHasNext] = useState(false);
  const [acting, setActing] = useState(false),
    [proposal, setProposal] = useState<string | null>(null);
  const [date, setDate] = useState(localDateValue()),
    [time, setTime] = useState('10:00');
  const sequence = useRef(0);
  const load = useCallback(
    async (nextPage = 1) => {
      const token = ++sequence.current;
      const cacheOptions = refreshKey ? { headers: { 'Cache-Control': 'no-cache' } } : undefined;
      setLoading(true);
      setError('');
      try {
        const profile = await api.get<{ data: { canManageDoctorRequests: boolean } }>(
          API.STAFF.ME,
          cacheOptions,
        );
        if (token !== sequence.current) return;
        setEligible(profile.data.data.canManageDoctorRequests);
        if (!profile.data.data.canManageDoctorRequests) {
          setRequests([]);
          return;
        }
        const response = await api.get<{ data: DoctorRequest[]; meta: { hasNext: boolean } }>(
          `${API.BOOKINGS.DOCTOR_REQUESTS}&page=${nextPage}&limit=20`,
          cacheOptions,
        );
        if (token !== sequence.current) return;
        setRequests(prev =>
          nextPage === 1 ? response.data.data : [...prev, ...response.data.data],
        );
        setPage(nextPage);
        setHasNext(response.data.meta.hasNext);
      } catch (err) {
        if (token === sequence.current) setError(extractApiError(err));
      } finally {
        if (token === sequence.current) setLoading(false);
      }
    },
    [refreshKey],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        sequence.current++;
      };
    }, [load]),
  );
  const act = async (id: string, propose: boolean) => {
    if (acting) return;
    setActing(true);
    try {
      if (propose) await proposeDoctorTime(id, date, time);
      else await acceptDoctorRequest(id);
      setProposal(null);
      await load();
      if (!propose)
        Alert.alert('Request accepted', 'The booking is now waiting for admin confirmation.');
    } catch (err) {
      Alert.alert(
        'Request could not be saved',
        err instanceof Error && !('response' in err) ? err.message : extractApiError(err),
      );
    } finally {
      setActing(false);
    }
  };
  return (
    <View style={styles.root}>
      {error ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert">{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()}>
            <Text style={styles.body}>Retry requests</Text>
          </Pressable>
        </View>
      ) : null}
      {acting ? (
        <ActivityIndicator accessibilityLabel="Saving doctor response" color={Colors.primary} />
      ) : null}
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading requests" color={Colors.primary} />
      ) : null}
      {!loading && !error && !eligible ? (
        <Text style={styles.body}>Doctor requests are available to verified visiting doctors.</Text>
      ) : null}
      <FlatList
        data={error ? [] : requests}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={() => void load()}
        ListEmptyComponent={
          !loading && !error && eligible ? (
            <Text style={styles.body}>No pending doctor requests.</Text>
          ) : null
        }
        ListFooterComponent={
          hasNext && !loading && !error ? (
            <Pressable accessibilityRole="button" onPress={() => void load(page + 1)}>
              <Text style={styles.body}>Load more requests</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>
              {item.patient.fullName} · {item.bookingNumber}
            </Text>
            <Text style={styles.body}>
              {item.package.name} · {item.city.name}
            </Text>
            {item.patient.primaryCondition ? (
              <Text style={styles.body}>{item.patient.primaryCondition}</Text>
            ) : null}
            <Text style={styles.body}>
              Requested: {new Date(item.requestedStartAt).toLocaleString()}
            </Text>
            {item.status === 'PENDING_DOCTOR' &&
            new Date(item.requestedStartAt).getTime() <= Date.now() ? (
              <Text style={styles.body}>Requested time has passed. Propose a future time.</Text>
            ) : null}
            {item.status === 'TIME_PROPOSED' ? (
              <Text style={styles.body}>
                Proposed:{' '}
                {item.proposedStartAt ? new Date(item.proposedStartAt).toLocaleString() : '—'} ·
                Awaiting customer response
              </Text>
            ) : (
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  style={styles.button}
                  disabled={
                    acting || loading || new Date(item.requestedStartAt).getTime() <= Date.now()
                  }
                  onPress={() => void act(item.id, false)}
                >
                  <Text style={styles.body}>Accept request</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.button}
                  disabled={acting || loading}
                  onPress={() => {
                    setProposal(item.id);
                    setDate(localDateValue());
                    setTime('10:00');
                  }}
                >
                  <Text style={styles.body}>Propose another time</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
      <Modal
        visible={proposal !== null}
        transparent
        onRequestClose={() => {
          if (!acting) setProposal(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Propose a future local date and time</Text>
            <TextInput
              accessibilityLabel="Proposal date"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
              editable={!acting}
              style={styles.input}
            />
            <TextInput
              accessibilityLabel="Proposal time"
              placeholder="HH:MM"
              value={time}
              onChangeText={setTime}
              editable={!acting}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              disabled={acting}
              onPress={() => {
                if (proposal) void act(proposal, true);
              }}
            >
              <Text style={styles.body}>{acting ? 'Saving…' : 'Send proposal'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={acting}
              onPress={() => setProposal(null)}
            >
              <Text style={styles.body}>Keep requested time</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { color: Colors.textSecondary },
  root: { flex: 1, padding: Spacing.md, backgroundColor: Colors.neutralLight },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  title: { color: Colors.textPrimary, fontWeight: '700' },
  actions: { gap: Spacing.sm },
  button: { padding: Spacing.md, backgroundColor: Colors.primarySurface, borderRadius: Radius.md },
  overlay: { flex: 1, justifyContent: 'center', padding: Spacing.xl, backgroundColor: '#0008' },
  input: {
    color: Colors.textPrimary,
    padding: Spacing.md,
    borderColor: Colors.neutralBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
});
