import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api, extractApiError } from '../../api/client';
import { API } from '../../api/endpoints';
import type { BookingDetailScreenProps } from '../../navigation/types';
import type { BookingDetail, BookingStatus } from '../../types/booking.types';

const STATUS_COLOR: Record<BookingStatus, string> = {
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

export function BookingDetailScreen({ route, navigation }: BookingDetailScreenProps): JSX.Element {
  const { id } = route.params;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: BookingDetail }>(
        API.BOOKINGS.DETAIL(id),
      );
      setBooking(data.data);
      navigation.setOptions({ title: data.data.bookingNumber });
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const handleCancel = (): void => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await api.patch(API.BOOKINGS.CANCEL(id));
            await fetchBooking();
          } catch (err) {
            Alert.alert('Error', extractApiError(err));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#0ea5e9" /></View>;
  }

  if (!booking) {
    return <View style={styles.center}><Text>Booking not found.</Text></View>;
  }

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);
  const color = STATUS_COLOR[booking.status];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Status header */}
      <View style={[styles.statusCard, { borderLeftColor: color }]}>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{booking.status}</Text>
        </View>
        <Text style={styles.price}>Rs {booking.package.price.toLocaleString()}</Text>
      </View>

      {/* Service */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service</Text>
        <Text style={styles.value}>{booking.serviceType.name}</Text>
        <Text style={styles.sub}>{booking.package.name}</Text>
      </View>

      {/* Patient */}
      {booking.patient && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <Text style={styles.value}>{booking.patient.fullName}</Text>
        </View>
      )}

      {/* Address */}
      {booking.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service address</Text>
          <Text style={styles.value}>{booking.address.street}</Text>
          <Text style={styles.sub}>{booking.address.area}, {booking.address.city.name}</Text>
          <Text style={styles.sub}>{booking.address.contactPhone}</Text>
        </View>
      )}

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled</Text>
        <Text style={styles.value}>
          {new Date(booking.requestedStartAt).toLocaleString('en-PK', {
            dateStyle: 'medium', timeStyle: 'short',
          })}
        </Text>
        <Text style={styles.sub}>Urgency: {booking.urgency.toLowerCase()}</Text>
      </View>

      {/* Visits */}
      {booking.visits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visits ({booking.visits.length})</Text>
          {booking.visits.map((v, i) => (
            <View key={v.id} style={styles.visitRow}>
              <Text style={styles.visitLabel}>Visit #{i + 1}</Text>
              <Text style={styles.visitStatus}>{v.status}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Cancel */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}
        >
          {cancelling
            ? <ActivityIndicator color="#ef4444" />
            : <Text style={styles.cancelText}>Cancel booking</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  price: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  visitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  visitLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  visitStatus: { fontSize: 13, color: '#64748b' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
