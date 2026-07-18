import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator, Linking,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { REPORT_TYPE_ICON, REPORT_TYPE_COLOR, REPORT_TYPE_BG, REPORT_TYPE_LABEL } from '../../../constants/reportType';
import { useMyReports } from './useMyReports';
import type { Report, ReportType } from '../../../types/useMyReports.types';

type Filter = 'ALL' | ReportType;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL',            label: 'All' },
  { id: 'LAB_RESULT',     label: 'Lab Results' },
  { id: 'PRESCRIPTION',   label: 'Prescriptions' },
  { id: 'VISIT_NOTE',     label: 'Visit Notes' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Images' },
];

export function MyReports(): JSX.Element {
  const [activeFilter, setActiveFilter] = useState<Filter>('ALL');
  const { reports, loading, refreshing, onRefresh } = useMyReports();

  const filtered = activeFilter === 'ALL'
    ? reports
    : reports.filter((r) => r.reportType === activeFilter);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <Text style={styles.headerSubtitle}>Medical reports from your visits.</Text>
      </View>

      {/* Filter tabs */}
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

      {/* Report list */}
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
              <Text style={styles.emptyHint}>Reports uploaded by your healthcare staff will appear here.</Text>
            </View>
          )
        }
        renderItem={({ item }) => <ReportCard report={item} />}
      />
    </SafeAreaView>
  );
}

function ReportCard({ report }: { report: Report }) {
  const color = REPORT_TYPE_COLOR[report.reportType];
  const bg    = REPORT_TYPE_BG[report.reportType];
  const icon  = REPORT_TYPE_ICON[report.reportType];

  return (
    <View style={styles.card}>
      {/* Type banner */}
      <View style={[styles.cardBanner, { backgroundColor: bg }]}>
        <MaterialDesignIcons name={icon} size={32} color={color} style={{ opacity: 0.4 }} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{report.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: bg }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{REPORT_TYPE_LABEL[report.reportType]}</Text>
          </View>
        </View>

        {report.notes ? <Text style={styles.cardNotes} numberOfLines={2}>{report.notes}</Text> : null}

        <View style={styles.cardMeta}>
          {report.patientName ? (
            <Text style={styles.metaText}><Text style={styles.metaLabel}>Patient: </Text>{report.patientName}</Text>
          ) : null}
          {report.bookingNumber ? (
            <Text style={styles.metaBooking}>{report.bookingNumber}</Text>
          ) : null}
          <Text style={styles.metaText}>{new Date(report.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>

        {report.hasFile && report.fileUrl ? (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.viewBtn} activeOpacity={0.7} onPress={() => Linking.openURL(report.fileUrl!)}>
              <MaterialDesignIcons name="open-in-new" size={14} color={Colors.textSecondary} />
              <Text style={styles.viewBtnText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => Linking.openURL(report.fileUrl!)}>
              <MaterialDesignIcons name="download" size={14} color={Colors.primary} />
              <Text style={styles.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.noFile}>No file attached</Text>
        )}
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
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardBanner: { height: 80, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: Spacing.md, gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, lineHeight: 20 },
  typeBadge: { borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  cardNotes: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  cardMeta: { gap: 2 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  metaLabel: { fontWeight: '600', color: Colors.textSecondary },
  metaBooking: { fontSize: FontSize.xs, color: Colors.neutralMuted, fontFamily: 'monospace' },
  cardActions: {
    flexDirection: 'row', gap: Spacing.sm, paddingTop: 6,
    borderTopWidth: 1, borderTopColor: Colors.neutralBorder,
  },
  viewBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.neutralBorder,
  },
  viewBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.primarySurface,
  },
  downloadBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  noFile: { fontSize: FontSize.xs, color: Colors.neutralMuted, textAlign: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.neutralBorder },
});
