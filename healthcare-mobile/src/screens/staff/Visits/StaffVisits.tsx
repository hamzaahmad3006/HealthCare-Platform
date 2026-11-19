import type { JSX } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { VISIT_STATUS_COLOR, VISIT_STATUS_LABEL } from '../../../constants/visitStatus';
import type { TabFilter, Visit } from '../../../types/StaffVisits.types';
import type { StaffStackParamList } from '../../../navigation/types';
import { useStaffVisits } from './useStaffVisits';
import { useUnreadBadge } from '../../shared/Notifications/useUnreadBadge';

type Nav = NativeStackNavigationProp<StaffStackParamList>;

const TABS: { id: TabFilter; label: string }[] = [
  { id: 'TODAY',     label: "Today" },
  { id: 'UPCOMING',  label: 'Upcoming' },
  { id: 'COMPLETED', label: 'Completed' },
];

export function StaffVisits(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const { activeTab, setActiveTab, visits, loading, refreshing, error, onRefresh, retry } = useStaffVisits();
  const unreadCount = useUnreadBadge();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>My Visits</Text>
            <Text style={styles.headerSubtitle}>Your assigned patient visits.</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <MaterialDesignIcons name="bell-outline" size={24} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(v) => v.id}
          contentContainerStyle={visits.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            error ? (
              <TouchableOpacity style={styles.emptyBox} onPress={retry} accessibilityRole="button">
                <MaterialDesignIcons name="alert-circle-outline" size={48} color={Colors.danger} />
                <Text style={styles.emptyTitle}>Could not load visits</Text>
                <Text style={styles.emptyHint}>{error}</Text>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyBox}>
                <MaterialDesignIcons name="calendar-blank" size={48} color={Colors.neutralBorder} />
                <Text style={styles.emptyTitle}>No visits</Text>
                <Text style={styles.emptyHint}>
                  {activeTab === 'TODAY' ? "You have no visits scheduled for today." : "No visits found."}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <VisitCard visit={item} onPress={() => navigation.navigate('VisitDetail', { id: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function openMapsForVisit(visit: Visit): void {
  const url =
    visit.latitude !== null && visit.longitude !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${visit.latitude},${visit.longitude}`
      : visit.addressLine
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${visit.addressLine}, Pakistan`)}`
        : null;
  if (url) {
    Linking.openURL(url).catch(() => {});
  }
}

function VisitCard({ visit, onPress }: { visit: Visit; onPress: () => void }) {
  const color = VISIT_STATUS_COLOR[visit.status];
  const hasLocation = Boolean(visit.addressLine || (visit.latitude !== null && visit.longitude !== null));
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.patientName}>{visit.patientName}</Text>
          <View style={styles.serviceRow}>
            <MaterialDesignIcons name="medical-bag" size={13} color={Colors.textMuted} />
            <Text style={styles.serviceText}>{visit.service}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.statusText, { color }]}>{VISIT_STATUS_LABEL[visit.status]}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.infoRow}>
          <MaterialDesignIcons name="clock-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            {new Date(visit.scheduledTime).toLocaleString('en-PK', {
              day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
            })}
          </Text>
        </View>
        {visit.addressLine ? (
          <View style={styles.infoRow}>
            <MaterialDesignIcons name="map-marker-outline" size={13} color={Colors.primary} />
            <Text style={[styles.infoText, styles.addressText]} numberOfLines={2}>
              {visit.addressLine}
            </Text>
          </View>
        ) : null}
        <View style={styles.cardFooterRow}>
          <View style={[styles.infoRow, { flex: 1 }]}>
            <MaterialDesignIcons name="receipt-text-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{visit.bookingNumber}</Text>
          </View>
          {hasLocation ? (
            <TouchableOpacity
              style={styles.navChip}
              activeOpacity={0.75}
              onPress={() => openMapsForVisit(visit)}
              accessibilityRole="button"
              accessibilityLabel="Navigate to patient"
            >
              <MaterialDesignIcons name="navigation-variant" size={13} color={Colors.primary} />
              <Text style={styles.navChipText}>Directions</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <MaterialDesignIcons name="chevron-right" size={20} color={Colors.neutralMuted} style={styles.chevron} />
    </TouchableOpacity>
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
    justifyContent: 'space-between',
  },
  headerTitleBox: {
    flex: 1,
  },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  tabsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  retryText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 3 },
  patientName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceText: { fontSize: FontSize.sm, color: Colors.textMuted },
  statusBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardBottom: { gap: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  addressText: { color: Colors.textPrimary, fontWeight: '500' },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary + '15',
    marginRight: 20,
  },
  navChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  chevron: { position: 'absolute', right: Spacing.md, top: '50%' },
});
