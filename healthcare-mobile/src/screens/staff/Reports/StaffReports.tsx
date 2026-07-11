import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import type { StaffReport } from '../../../types/StaffReports.types';

export function StaffReports(): JSX.Element {
  const reports: StaffReport[] = []; // wired to API later

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtitle}>Reports you have submitted for patients.</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        contentContainerStyle={reports.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialDesignIcons name="file-document-outline" size={48} color={Colors.neutralBorder} />
            <Text style={styles.emptyTitle}>No reports yet</Text>
            <Text style={styles.emptyHint}>Reports you submit for patients will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardIconBox}>
              <MaterialDesignIcons name="clipboard-text" size={22} color={Colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.cardPatient}>{item.patientName}</Text>
              <View style={styles.cardMeta}>
                <MaterialDesignIcons name="clock-outline" size={12} color={Colors.neutralMuted} />
                <Text style={styles.cardDate}>{item.visitDate}</Text>
                {item.hasFile && (
                  <View style={styles.fileBadge}>
                    <Text style={styles.fileBadgeText}>File attached</Text>
                  </View>
                )}
              </View>
            </View>
            <MaterialDesignIcons name="chevron-right" size={20} color={Colors.neutralMuted} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
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
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIconBox: {
    width: 44, height: 44, borderRadius: Radius.sm, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardPatient: { fontSize: FontSize.sm, color: Colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardDate: { fontSize: FontSize.xs, color: Colors.neutralMuted },
  fileBadge: { backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  fileBadgeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
});
