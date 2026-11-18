import type { MaterialIconName } from '../../../types/icons.types';
import type { JSX } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TouchableOpacity,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from './useNotifications';
import { useAppSelector } from '../../../store';
import { navigateToNotification } from '../../../utils/notificationNavigation';
import type { NotificationItem } from '../../../types/notification.types';

function iconForTemplate(code: string): MaterialIconName {
  if (code === 'STAFF_VERIFIED') return 'check-circle-outline';
  if (code.includes('REPORT')) return 'file-document-outline';
  if (code.includes('CANCEL')) return 'close-circle-outline';
  if (code.includes('CONFIRM') || code.includes('ACCEPT')) return 'check-circle-outline';
  if (code.includes('ASSIGN') || code.includes('STAFF')) return 'account-check-outline';
  if (code.includes('RESCHEDULE') || code.includes('PROPOSE')) return 'calendar-clock';
  return 'bell-outline';
}

function titleForTemplate(code: string): string {
  switch (code) {
    case 'STAFF_VERIFIED':
      return '🎉 Account Verified!';
    case 'STAFF_ASSIGNED':
      return 'New Visit Assigned';
    case 'BOOKING_RECEIVED':
      return 'Booking Received';
    case 'BOOKING_CONFIRMED':
      return 'Booking Confirmed';
    case 'BOOKING_CANCELLED':
      return 'Booking Cancelled';
    case 'STAFF_EN_ROUTE':
      return 'Staff On The Way';
    case 'VISIT_COMPLETED':
      return 'Visit Completed';
    case 'VISIT_REMINDER':
      return 'Upcoming Visit Reminder';
    case 'REPORT_AVAILABLE':
      return 'Medical Report Ready';
    case 'DOCTOR_BOOKING_REQUEST':
    case 'DOCTOR_BOOKING_REQUESTED':
      return 'New Doctor Request';
    case 'DOCTOR_ACCEPTED':
      return 'Doctor Accepted';
    case 'DOCTOR_TIME_PROPOSED':
      return 'New Time Proposed';
    case 'DOCTOR_TIME_ACCEPTED':
      return 'Proposed Time Accepted';
    default:
      return code.replace(/_/g, ' ');
  }
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function Notifications(): JSX.Element {
  const navigation = useNavigation();
  const { notifications, loading, refreshing, error, onRefresh, retry } = useNotifications();
  const role = useAppSelector((s) => s.auth.user?.role);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {typeof navigation.canGoBack === 'function' && navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialDesignIcons name="arrow-left" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Text style={styles.headerSubtitle}>Updates about your bookings and visits.</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            error ? (
              <TouchableOpacity style={styles.emptyBox} onPress={retry} accessibilityRole="button">
                <MaterialDesignIcons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={styles.emptyTitle}>Could not load notifications</Text>
                <Text style={styles.emptyHint}>{error}</Text>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons name="bell-outline" size={48} color={Colors.neutralBorder} />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptyHint}>Updates about your bookings will show up here.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => {
                if (role) {
                  navigateToNotification(role, {
                    templateCode: item.templateCode,
                    bookingId: item.bookingId,
                    bookingVisitId: item.bookingVisitId,
                  });
                }
              }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const isVerified = item.templateCode === 'STAFF_VERIFIED';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        item.isUnread && styles.rowUnread,
        isVerified && styles.rowVerified,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconBox,
          item.isUnread && styles.iconBoxUnread,
          isVerified && styles.iconBoxVerified,
        ]}
      >
        <MaterialDesignIcons
          name={iconForTemplate(item.templateCode)}
          size={20}
          color={isVerified ? Colors.success : item.isUnread ? Colors.primary : Colors.neutral}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, isVerified && styles.rowTitleVerified]}>
          {titleForTemplate(item.templateCode)}
        </Text>
        <Text style={styles.rowText} numberOfLines={3}>{item.renderedContent}</Text>
        <Text style={styles.rowTime}>{formatWhen(item.createdAt)}</Text>
      </View>
      {item.isUnread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutralLight },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retryText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  rowUnread: { borderWidth: 1, borderColor: Colors.primaryLight },
  rowVerified: { borderWidth: 1, borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  rowPressed: { opacity: 0.7 },
  iconBox: {
    width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.neutralLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxUnread: { backgroundColor: Colors.primarySurface },
  iconBoxVerified: { backgroundColor: '#D1FAE5' },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  rowTitleVerified: { color: '#065F46' },
  rowText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 19 },
  rowTime: { fontSize: FontSize.xs, color: Colors.neutralMuted, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4,
  },
});
