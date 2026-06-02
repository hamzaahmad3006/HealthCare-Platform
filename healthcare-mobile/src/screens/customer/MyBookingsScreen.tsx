import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { api, extractApiError } from '../../api/client';
import { API } from '../../api/endpoints';
import type { MyBookingsScreenProps } from '../../navigation/types';
import type { Booking, BookingStatus } from '../../types/booking.types';

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING:        '#f59e0b',
  CONFIRMED:      '#3b82f6',
  ASSIGNED:       '#8b5cf6',
  IN_PROGRESS:    '#0ea5e9',
  COMPLETED:      '#10b981',
  CANCELLED:      '#ef4444',
  RESCHEDULED:    '#f97316',
  PENDING_DOCTOR: '#a855f7',
  TIME_PROPOSED:  '#06b6d4',
};

export function MyBookingsScreen({ navigation }: MyBookingsScreenProps): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: Booking[] }>(API.BOOKINGS.LIST);
      setBookings(data.data);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleLogout = (): void => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 4 }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>Sign out</Text>
        </TouchableOpacity>
      ),
      title: `Hi, ${user?.fullName.split(' ')[0] ?? 'there'}`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, user]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;
  }

  return (
    <FlatList
      style={styles.list}
      data={bookings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={bookings.length === 0 ? styles.empty : styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyHint}>Book a nurse, doctor, or caregiver in under a minute.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('BookingDetail', { id: item.id })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.bookingNo}>{item.bookingNumber}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.serviceName}>{item.serviceType.name}</Text>
          <Text style={styles.packageName}>{item.package.name}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.date}>
              {new Date(item.requestedStartAt).toLocaleDateString('en-PK', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
            <Text style={styles.price}>Rs {item.package.price.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  empty: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingNo: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  serviceName: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  packageName: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  date: { fontSize: 13, color: '#475569' },
  price: { fontSize: 14, fontWeight: '700', color: '#0ea5e9' },
});
