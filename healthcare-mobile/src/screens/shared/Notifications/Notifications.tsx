import {
  View, Text, FlatList, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useNotifications } from './useNotifications';
import type { NotificationItem } from '../../../types/notification.types';

function iconForTemplate(code: string): string {
  if (code.includes('REPORT')) return 'file-document-outline';
  if (code.includes('CANCEL')) return 'close-circle-outline';
  if (code.includes('CONFIRM') || code.includes('ACCEPT')) return 'check-circle-outline';
  if (code.includes('ASSIGN') || code.includes('STAFF')) return 'account-check-outline';
  if (code.includes('RESCHEDULE') || code.includes('PROPOSE')) return 'calendar-clock';
  return 'bell-outline';
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function Notifications(): JSX.Element {
  const { notifications, loading, refreshing, onRefresh } = useNotifications();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
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
            <View style={styles.emptyBox}>
              <MaterialDesignIcons name="bell-outline" size={48} color={Colors.neutralBorder} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyHint}>Updates about your bookings will show up here.</Text>
            </View>
          }
          renderItem={({ item }) => <NotificationRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <View style={[styles.row, item.isUnread && styles.rowUnread]}>
      <View style={[styles.iconBox, item.isUnread && styles.iconBoxUnread]}>
        <MaterialDesignIcons
          name={iconForTemplate(item.templateCode)}
          size={20}
          color={item.isUnread ? Colors.primary : Colors.neutral}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowText} numberOfLines={3}>{item.renderedContent}</Text>
        <Text style={styles.rowTime}>{formatWhen(item.createdAt)}</Text>
      </View>
      {item.isUnread && <View style={styles.unreadDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutralLight },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  rowUnread: { borderWidth: 1, borderColor: Colors.primaryLight },
  iconBox: {
    width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.neutralLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxUnread: { backgroundColor: Colors.primarySurface },
  rowBody: { flex: 1, gap: 3 },
  rowText: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 19 },
  rowTime: { fontSize: FontSize.xs, color: Colors.neutralMuted, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4,
  },
});
