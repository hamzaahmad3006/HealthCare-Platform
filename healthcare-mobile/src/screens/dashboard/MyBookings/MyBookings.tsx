import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useMyBookings } from './useMyBookings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { Booking, BookingStatus } from '../../../types/booking.types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'MyBookings'>;

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING:        Colors.warning,
  CONFIRMED:      Colors.info,
  ASSIGNED:       '#8b5cf6',
  IN_PROGRESS:    Colors.primaryLight,
  COMPLETED:      Colors.success,
  CANCELLED:      Colors.danger,
  RESCHEDULED:    '#f97316',
  PENDING_DOCTOR: '#a855f7',
  TIME_PROPOSED:  '#06b6d4',
};

export function MyBookings({ navigation }: Props): JSX.Element {
  const { bookings, loading, refreshing, onRefresh, goToDetail } = useMyBookings(navigation);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={bookings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
      ListEmptyComponent={<EmptyState />}
      renderItem={({ item }) => (
        <BookingCard booking={item} onPress={() => goToDetail(item.id)} />
      )}
    />
  );
}

function EmptyState() {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No bookings yet</Text>
      <Text style={styles.emptyHint}>Book a nurse, doctor, or caregiver in under a minute.</Text>
    </View>
  );
}

function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const color = STATUS_COLORS[booking.status];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <Text style={styles.bookingNo}>{booking.bookingNumber}</Text>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{booking.status}</Text>
        </View>
      </View>
      <Text style={styles.serviceName}>{booking.serviceType.name}</Text>
      <Text style={styles.packageName}>{booking.package.name}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {new Date(booking.requestedStartAt).toLocaleDateString('en-PK', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
        <Text style={[styles.price, { color: Colors.primary }]}>
          Rs {booking.package.price.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: Colors.neutralLight,
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingNo: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  packageName: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
