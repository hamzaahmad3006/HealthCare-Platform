import type { JSX } from 'react';
import {
  View,
  Alert,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
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
    booking, loading, error, reload, actingTime, handleTimeResponse, cancelling, canCancel,
    cancelModalVisible, cancelReason, setCancelReason,
    openCancelModal, closeCancelModal, confirmCancel,
    rating, setRating, reviewText, setReviewText, submittingReview, submitReview,
  } = useBookingDetail(navigation, route);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>{error || 'Booking not found.'}</Text><TouchableOpacity accessibilityRole="button" onPress={() => void reload()}><Text>Retry booking</Text></TouchableOpacity>
      </View>
    );
  }

  const color = STATUS_COLORS[booking.status];

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void reload()} />}
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

      {/* Uber-Style Live Staff Tracking Radar & Route Map Card */}
      {(() => {
        const liveTrack =
          booking.activeLiveTracking ??
          booking.visits?.find((v) => v.status === 'EN_ROUTE')?.liveTracking ??
          booking.visits?.find((v) => v.status === 'CHECKED_IN')?.liveTracking ??
          null;
        if (!liveTrack) return null;
        const isArrived = liveTrack.status === 'CHECKED_IN';
        const googleLiveRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${liveTrack.staffLatitude},${liveTrack.staffLongitude}&destination=${liveTrack.patientLatitude},${liveTrack.patientLongitude}&travelmode=driving`;

        return (
          <View style={styles.liveTrackerCard}>
            {/* Top Header */}
            <View
              style={[
                styles.liveTrackerHeader,
                isArrived && { backgroundColor: '#047857' },
              ]}
            >
              <View style={styles.livePillRow}>
                <View style={styles.livePulsePill}>
                  <Text style={styles.livePulsePillText}>
                    {isArrived ? '✅ ARRIVED & CHECKED IN' : '🟢 LIVE STAFF GPS RADAR'}
                  </Text>
                </View>
                <Text style={styles.liveAutoSyncText}>Auto-sync 6s</Text>
              </View>

              <Text style={styles.liveTrackerTitle}>
                {isArrived
                  ? `${liveTrack.staffName} is at your location`
                  : `${liveTrack.staffName} is on the way`}
              </Text>
              <Text style={styles.liveTrackerSub}>{liveTrack.headingLabel}</Text>

              {liveTrack.staffReviews && liveTrack.staffReviews.totalReviews > 0 ? (
                <View style={styles.staffRatingBadgeRow}>
                  <Text style={styles.staffRatingPill}>
                    ★ {liveTrack.staffReviews.averageRating} ({liveTrack.staffReviews.totalReviews}{' '}
                    {liveTrack.staffReviews.totalReviews === 1 ? 'review' : 'reviews'})
                  </Text>
                </View>
              ) : null}

              {/* 3 Hero Metric Boxes */}
              <View style={styles.liveMetricsGrid}>
                <View style={styles.liveMetricBox}>
                  <Text style={styles.liveMetricLabel}>
                    {isArrived ? 'STATUS' : 'EST. ARRIVAL'}
                  </Text>
                  <Text style={styles.liveMetricValue}>
                    {isArrived ? 'On Site' : `${liveTrack.etaMinutes} min`}
                  </Text>
                </View>
                <View style={styles.liveMetricBox}>
                  <Text style={styles.liveMetricLabel}>DISTANCE</Text>
                  <Text style={styles.liveMetricValue}>
                    {isArrived ? '0.0 km' : `${liveTrack.distanceKm} km`}
                  </Text>
                </View>
                <View style={styles.liveMetricBox}>
                  <Text style={styles.liveMetricLabel}>PROGRESS</Text>
                  <Text style={styles.liveMetricValue}>
                    {liveTrack.progressPercent}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Visual Interactive Route Map Canvas */}
            <View style={styles.liveMapCanvas}>
              <View style={styles.routeEndpointsRow}>
                <Text style={styles.routeNodeLabel}>🏥 Dispatch Hub</Text>
                <Text style={styles.routeNodeLabel}>
                  🏠 {booking.patient?.fullName ?? 'Patient Home'}
                </Text>
              </View>

              {/* Progress Track with Moving Ambulance Marker */}
              <View style={styles.routeTrackOuter}>
                <View
                  style={[
                    styles.routeTrackFill,
                    { width: `${Math.min(100, Math.max(10, liveTrack.progressPercent))}%` },
                  ]}
                />
                <View
                  style={[
                    styles.staffMovingMarker,
                    {
                      left: `${Math.min(90, Math.max(4, liveTrack.progressPercent - 5))}%`,
                    },
                  ]}
                >
                  <Text style={styles.staffMarkerEmoji}>🚑</Text>
                </View>
              </View>

              {/* Live GPS Coordinates Row */}
              <View style={styles.liveCoordsRow}>
                <Text style={styles.liveCoordChip}>
                  📍 Staff Pin: {liveTrack.staffLatitude.toFixed(4)},{' '}
                  {liveTrack.staffLongitude.toFixed(4)}
                </Text>
                <Text style={styles.liveCoordChip}>
                  🎯 Dest: {liveTrack.patientLatitude.toFixed(4)},{' '}
                  {liveTrack.patientLongitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Bottom Actions: Open Live Route in Google Maps & Call Staff */}
            <View style={styles.liveActionsRow}>
              <TouchableOpacity
                style={styles.liveMapBtn}
                activeOpacity={0.85}
                onPress={() => void Linking.openURL(googleLiveRouteUrl)}
              >
                <Text style={styles.liveMapBtnText}>
                  🗺️ Track Live on Google Maps
                </Text>
              </TouchableOpacity>

              {liveTrack.staffPhone ? (
                <TouchableOpacity
                  style={styles.liveCallBtn}
                  activeOpacity={0.85}
                  onPress={() => void Linking.openURL(`tel:${liveTrack.staffPhone}`)}
                >
                  <Text style={styles.liveCallBtnText}>📞 Call Staff</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Customer Reviews about this Staff Member */}
            {liveTrack.staffReviews && liveTrack.staffReviews.recentReviews.length > 0 ? (
              <View style={styles.staffReviewsBox}>
                <Text style={styles.staffReviewsHeader}>
                  💬 Customer Reviews for {liveTrack.staffName}
                </Text>
                {liveTrack.staffReviews.recentReviews.map((rev) => (
                  <View key={rev.id} style={styles.staffReviewQuoteCard}>
                    <View style={styles.staffReviewQuoteTop}>
                      <Text style={styles.staffReviewAuthor}>{rev.customerName}</Text>
                      <Text style={styles.staffReviewStars}>
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                      </Text>
                    </View>
                    <Text style={styles.staffReviewQuoteText}>
                      {rev.reviewText ? `"${rev.reviewText}"` : 'Rated this care visit highly.'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })()}

      {booking.status === 'PENDING_DOCTOR' ? <Section title="Waiting for your doctor"><Text style={styles.sub}>Your selected doctor will accept this request or propose another time. Admin confirmation follows.</Text></Section> : null}
      {booking.status === 'PENDING' && booking.preferredDoctorUserId ? <Section title="Awaiting admin confirmation"><Text style={styles.sub}>The agreed time is waiting for admin confirmation. Staff assignment follows confirmation.</Text></Section> : null}
      {booking.status === 'TIME_PROPOSED' && booking.proposedStartAt ? <Section title="Doctor proposed another time">
        <Text style={styles.value}>{new Date(booking.proposedStartAt).toLocaleString()}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} disabled={actingTime || cancelling || new Date(booking.proposedStartAt).getTime() <= Date.now()} onPress={() => void handleTimeResponse(true)}><Text>{actingTime ? 'Saving…' : 'Accept proposed time'}</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.cancelBtn} disabled={actingTime || cancelling} onPress={() => Alert.alert('Decline proposed time?', 'This will cancel the booking.', [{ text: 'Keep booking', style: 'cancel' }, { text: 'Decline and cancel', style: 'destructive', onPress: () => void handleTimeResponse(false) }])}><Text>Decline proposed time</Text></TouchableOpacity>
      </Section> : null}

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
        <Text style={styles.sub}>Urgency: {(booking.urgencyLevel ?? 'ROUTINE').toLowerCase()}</Text>
      </Section>

      {/* Visits */}
      {(booking.visits?.length ?? 0) > 0 && (
        <Section title={`Visits (${booking.visits.length})`}>
          {booking.visits.map((v, i) => (
            <View key={v.id} style={styles.visitRow}>
              <Text style={styles.visitLabel}>Visit #{i + 1}</Text>
              <Text style={styles.visitStatus}>{v.status}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Staff Feedback / Review */}
      {booking.status === 'COMPLETED' && (
        <Section title="Rate Your Staff Visit">
          {booking.reviews?.[0] ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.starRowText}>
                {'★'.repeat(booking.reviews[0].rating)}
                {'☆'.repeat(Math.max(0, 5 - booking.reviews[0].rating))}
              </Text>
              {booking.reviews[0].reviewText ? (
                <Text style={styles.sub}>{booking.reviews[0].reviewText}</Text>
              ) : null}
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={styles.sub}>
                How was your care visit{booking.visits?.find((v) => v.assignedStaff?.user?.fullName)?.assignedStaff?.user?.fullName ? ` with ${booking.visits.find((v) => v.assignedStaff?.user?.fullName)?.assignedStaff?.user?.fullName}` : ''}?
              </Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} stars`}
                  >
                    <Text style={[styles.starPickerBtn, star <= rating && styles.starPickerBtnActive]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reasonInput}
                placeholder="Share your feedback about the staff member (optional)…"
                placeholderTextColor={Colors.textMuted}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                editable={!submittingReview}
              />
              <TouchableOpacity
                style={[styles.reviewSubmitBtn, (rating === 0 || submittingReview) && styles.cancelBtnDisabled]}
                disabled={rating === 0 || submittingReview}
                onPress={() => void submitReview()}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {submittingReview ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.reviewSubmitText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Section>
      )}

      {/* Cancel button */}
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          disabled={actingTime || cancelling}
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
  starRowText: {
    fontSize: 22,
    color: '#f59e0b',
    letterSpacing: 2,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  starPickerBtn: {
    fontSize: 30,
    color: Colors.neutralBorder,
  },
  starPickerBtnActive: {
    color: '#f59e0b',
  },
  reviewSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewSubmitText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  liveTrackerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  liveTrackerHeader: {
    backgroundColor: Colors.primaryDark,
    padding: Spacing.md,
  },
  livePillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  livePulsePill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  livePulsePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  liveAutoSyncText: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '600',
  },
  liveTrackerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  liveTrackerSub: {
    fontSize: FontSize.xs,
    color: '#D1FAE5',
    marginTop: 2,
  },
  liveMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
  },
  liveMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  liveMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  liveMetricValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  liveMapCanvas: {
    backgroundColor: '#ECFDF5',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  routeEndpointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeNodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  routeTrackOuter: {
    height: 12,
    backgroundColor: '#D1D5DB',
    borderRadius: 999,
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 8,
  },
  routeTrackFill: {
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 999,
  },
  staffMovingMarker: {
    position: 'absolute',
    top: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  staffMarkerEmoji: {
    fontSize: 15,
  },
  liveCoordsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 4,
  },
  liveCoordChip: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#047857',
    fontWeight: '700',
  },
  liveActionsRow: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: Colors.white,
  },
  liveMapBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  liveMapBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  liveCallBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveCallBtnText: {
    color: '#065F46',
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  staffRatingBadgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  staffRatingPill: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  staffReviewsBox: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: Spacing.sm,
    gap: 6,
  },
  staffReviewsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  staffReviewQuoteCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffReviewQuoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  staffReviewAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  staffReviewStars: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  staffReviewQuoteText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
