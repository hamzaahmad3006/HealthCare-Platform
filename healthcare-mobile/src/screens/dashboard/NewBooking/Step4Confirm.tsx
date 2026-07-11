import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

export interface BookingSummary {
  service: string;
  package: string;
  price: string;
  patient: string;
  address: string;
  date: string;
  time: string;
  urgency: string;
  gender: string;
  instructions: string;
}

interface Props {
  summary: BookingSummary;
  onBack?: () => void;
  onConfirm?: () => void;
  submitting?: boolean;
}

export function Step4Confirm({ summary, onBack, onConfirm, submitting = false }: Props): JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Confirm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step bar */}
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <Text style={styles.stepName}>Review & Confirm</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Summary rows */}
        <View style={styles.summaryCard}>
          <SummaryRow label="Service"      value={summary.service} />
          <SummaryRow label="Package"      value={summary.package} />
          <SummaryRow label="Patient"      value={summary.patient} />
          <SummaryRow label="Address"      value={summary.address} />
          <SummaryRow label="Date"         value={summary.date} />
          <SummaryRow label="Time"         value={summary.time} />
          <SummaryRow label="Urgency"      value={summary.urgency} />
          <SummaryRow label="Staff Gender" value={summary.gender} />
          <SummaryRow label="Instructions" value={summary.instructions} last />
        </View>

        {/* Total price */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>{summary.price}</Text>
          </View>
          <Text style={styles.totalNote}>
            Pay after care is delivered. No charges until confirmed.
          </Text>
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <MaterialDesignIcons name="information-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.infoNoteText}>
            Confirming creates the booking. You'll get an acknowledgement within minutes.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backFooterBtn} onPress={onBack} disabled={submitting} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={18} color={Colors.textSecondary} />
          <Text style={styles.backFooterText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <MaterialDesignIcons name="check-circle" size={18} color={Colors.white} />
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  headerRight: { width: 36 },
  stepRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 6,
  },
  stepLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  stepName:  { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  progressTrack: {
    height: 4, backgroundColor: Colors.neutralBorder, marginHorizontal: Spacing.xl,
    borderRadius: Radius.full, marginBottom: Spacing.md,
  },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: Radius.full },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 32 },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.neutralBorder, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textMuted, width: 110 },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  totalCard: {
    backgroundColor: Colors.primarySurface, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.primaryLight, gap: 6,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  totalPrice: { fontSize: FontSize.xxl + 4, fontWeight: '800', color: Colors.primary },
  totalNote: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  infoNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: Colors.neutralLight, borderRadius: Radius.md, padding: Spacing.md,
  },
  infoNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
  footer: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.neutralBorder,
  },
  backFooterBtn: {
    flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.neutralBorder,
  },
  backFooterText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: {
    flex: 2, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  confirmBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  confirmBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
