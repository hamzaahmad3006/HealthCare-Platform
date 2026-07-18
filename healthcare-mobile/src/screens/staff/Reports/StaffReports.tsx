import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { REPORT_TYPE_ICON, REPORT_TYPE_COLOR, REPORT_TYPE_BG, REPORT_TYPE_LABEL } from '../../../constants/reportType';
import { useStaffReports } from './useStaffReports';
import type { StaffReport, ReportType } from '../../../types/StaffReports.types';

type Filter = 'ALL' | ReportType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL',            label: 'All' },
  { id: 'LAB_RESULT',     label: 'Lab Results' },
  { id: 'PRESCRIPTION',   label: 'Prescriptions' },
  { id: 'VISIT_NOTE',     label: 'Visit Notes' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Images' },
];

export function StaffReports(): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL');
  const { reports, loading, refreshing, onRefresh } = useStaffReports();

  const filtered = activeFilter === 'ALL'
    ? reports
    : reports.filter((r) => r.reportType === activeFilter);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtitle}>Reports you have submitted for patients.</Text>
      </View>

      <View style={styles.filterWrapper}>
        <FlatList
          data={FILTERS}
          keyExtractor={(f) => f.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, activeFilter === item.id && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <MaterialDesignIcons name="file-document-outline" size={48} color={Colors.neutralBorder} />
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyHint}>Reports you submit for patients will appear here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <ReportCard report={item} />}
      />
    </SafeAreaView>
  );
}

function ReportCard({ report }: { report: StaffReport }) {
  const color = REPORT_TYPE_COLOR[report.reportType];
  const bg    = REPORT_TYPE_BG[report.reportType];
  const icon  = REPORT_TYPE_ICON[report.reportType];

  return (
    <View style={styles.card}>
      <View style={styles.cardIconBox}>
        <MaterialDesignIcons name={icon} size={22} color={color} />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{report.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: bg }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{REPORT_TYPE_LABEL[report.reportType]}</Text>
          </View>
        </View>
        {report.patientName ? <Text style={styles.cardPatient}>{report.patientName}</Text> : null}
        <View style={styles.cardMeta}>
          <MaterialDesignIcons name="clock-outline" size={12} color={Colors.neutralMuted} />
          <Text style={styles.cardDate}>
            {new Date(report.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          {report.hasFile ? (
            <TouchableOpacity
              style={styles.fileBadge}
              activeOpacity={0.7}
              onPress={() => report.fileUrl && Linking.openURL(report.fileUrl)}
            >
              <Text style={styles.fileBadgeText}>File attached</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
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
  filterWrapper: { backgroundColor: Colors.white, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder },
  filterRow: { paddingHorizontal: Spacing.xl, paddingTop: 10, gap: 6 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full,
    backgroundColor: Colors.neutralLight,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  filterChipTextActive: { color: Colors.white },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIconBox: {
    width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  typeBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardPatient: { fontSize: FontSize.sm, color: Colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardDate: { fontSize: FontSize.xs, color: Colors.neutralMuted },
  fileBadge: { backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  fileBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
});
