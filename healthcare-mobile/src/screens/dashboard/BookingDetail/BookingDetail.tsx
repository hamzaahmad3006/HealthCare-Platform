import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useBookingDetail } from './useBookingDetail';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CustomerStackParamList } from '../../../navigation/types';
import type { BookingStatus } from '../../../types/booking.types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'BookingDetail'>;

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

export function BookingDetail({ navigation, route }: Props): JSX.Element {
  const {
    booking, loading, cancelling, canCancel,
    cancelModalVisible, cancelReason, setCancelReason,
    openCancelModal, closeCancelModal, confirmCancel,
  } = useBookingDetail(navigation, route);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Booking not found.</Text>
      </View>
    );
  }

  const color = STATUS_COLORS[booking.status];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Status card */}
      <View style={[styles.statusCard, { borderLeftColor: color }]}>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{booking.status}</Text>
        </View>
        <Text style={styles.price}>{booking.currency} {Number(booking.totalPrice).toLocaleString()}</Text>
      </View>

      {/* Service */}
      <Section title="Service">
        <Text style={styles.value}>{booking.serviceType.name}</Text>
        <Text style={styles.sub}>{booking.package.name}</Text>
      </Section>

      {/* Patient */}
      {booking.patient && (
        <Section title="Patient">
          <Text style={styles.value}>{booking.patient.fullName}</Text>
        </Section>
      )}

      {/* Address */}
      {booking.address && (
        <Section title="Service Address">
          <Text style={styles.value}>{booking.address.line1}</Text>
          <Text style={styles.sub}>{booking.address.area}{booking.city ? `, ${booking.city.name}` : ''}</Text>
          <Text style={styles.sub}>{booking.address.contactPhone}</Text>
        </Section>
      )}

      {/* Schedule */}
      <Section title="Scheduled">
        <Text style={styles.value}>
          {new Date(booking.requestedStartAt).toLocaleString('en-PK', {
            dateStyle: 'medium', timeStyle: 'short',
          })}
        </Text>
        <Text style={styles.sub}>Urgency: {booking.urgencyLevel.toLowerCase()}</Text>
      </Section>

      {/* Visits */}
      {booking.visits.length > 0 && (
        <Section title={`Visits (${booking.visits.length})`}>
          {booking.visits.map((v, i) => (
            <View key={v.id} style={styles.visitRow}>
              <Text style={styles.visitLabel}>Visit #{i + 1}</Text>
              <Text style={styles.visitStatus}>{v.status}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Cancel button */}
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={openCancelModal}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSub}>Please tell us why you're cancelling.</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for cancelling"
              placeholderTextColor={Colors.textMuted}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              editable={!cancelling}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={closeCancelModal}
                disabled={cancelling}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDismissText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, cancelling && styles.cancelBtnDisabled]}
                onPress={confirmCancel}
                disabled={cancelling}
                activeOpacity={0.8}
              >
                {cancelling ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.neutralLight,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.sm,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutralLight,
  },
  notFound: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  value: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralBorder,
  },
  visitLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  visitStatus: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelBtnDisabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalDismissBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDismissText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
