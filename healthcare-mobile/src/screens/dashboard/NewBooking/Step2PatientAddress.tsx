import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

const MOCK_PATIENTS = [
  { id: '1', fullName: 'Ahmed Khan',   relation: 'Self' },
  { id: '2', fullName: 'Sara Khan',    relation: 'Spouse' },
];

const MOCK_ADDRESSES = [
  { id: '1', label: 'Home',  line1: 'House 12, Block B', area: 'DHA Phase 5', phone: '+92 300 1234567' },
  { id: '2', label: 'Clinic', line1: 'Shop 4, Iqbal Town', area: 'Lahore',     phone: '+92 321 9876543' },
];

interface Props {
  onBack?: () => void;
  onNext?: () => void;
}

export function Step2PatientAddress({ onBack, onNext }: Props): JSX.Element {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const canProceed = selectedPatient !== null && selectedAddress !== null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient & Address</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step bar */}
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>Step 2 of 4</Text>
        <Text style={styles.stepName}>Patient & Address</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Patient ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <MaterialDesignIcons name="account" size={16} color={Colors.primary} />
            <Text style={styles.sectionLabel}>Patient</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <MaterialDesignIcons name="plus" size={14} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add patient</Text>
          </TouchableOpacity>
        </View>

        {MOCK_PATIENTS.length === 0 ? (
          <TouchableOpacity style={styles.emptyDashed} activeOpacity={0.8}>
            <MaterialDesignIcons name="plus" size={24} color={Colors.neutralMuted} />
            <Text style={styles.emptyDashedTitle}>Add your first patient</Text>
            <Text style={styles.emptyDashedHint}>The person who'll receive care (yourself or family member)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cardsGrid}>
            {MOCK_PATIENTS.map((p) => {
              const active = selectedPatient === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.selectCard, active && styles.selectCardActive]}
                  onPress={() => setSelectedPatient(p.id)}
                  activeOpacity={0.8}
                >
                  {active && (
                    <View style={styles.checkIcon}>
                      <MaterialDesignIcons name="check-circle" size={18} color={Colors.primary} />
                    </View>
                  )}
                  <Text style={[styles.selectCardName, active && styles.selectCardNameActive]}>
                    {p.fullName}
                  </Text>
                  <Text style={styles.selectCardSub}>{p.relation}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Address ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <MaterialDesignIcons name="map-marker" size={16} color={Colors.primary} />
            <Text style={styles.sectionLabel}>Service Address</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
            <MaterialDesignIcons name="plus" size={14} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add address</Text>
          </TouchableOpacity>
        </View>

        {MOCK_ADDRESSES.length === 0 ? (
          <TouchableOpacity style={styles.emptyDashed} activeOpacity={0.8}>
            <MaterialDesignIcons name="plus" size={24} color={Colors.neutralMuted} />
            <Text style={styles.emptyDashedTitle}>Add a service address</Text>
            <Text style={styles.emptyDashedHint}>Where should our staff arrive?</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.cardsGrid}>
            {MOCK_ADDRESSES.map((a) => {
              const active = selectedAddress === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.selectCard, active && styles.selectCardActive]}
                  onPress={() => setSelectedAddress(a.id)}
                  activeOpacity={0.8}
                >
                  {active && (
                    <View style={styles.checkIcon}>
                      <MaterialDesignIcons name="check-circle" size={18} color={Colors.primary} />
                    </View>
                  )}
                  <Text style={[styles.selectCardName, active && styles.selectCardNameActive]}>
                    {a.label}
                  </Text>
                  <Text style={styles.selectCardSub}>{a.line1}, {a.area}</Text>
                  <Text style={styles.selectCardPhone}>{a.phone}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backFooterBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={18} color={Colors.textSecondary} />
          <Text style={styles.backFooterText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={canProceed ? onNext : undefined}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Continue</Text>
          <MaterialDesignIcons name="arrow-right" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.sm, borderWidth: 1.5, borderColor: Colors.primary,
  },
  addBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  emptyDashed: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.neutralBorder, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center', gap: 6,
  },
  emptyDashedTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  emptyDashedHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  selectCard: {
    width: '47.5%', borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md,
    padding: Spacing.md, backgroundColor: Colors.white, position: 'relative',
  },
  selectCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  checkIcon: { position: 'absolute', top: 8, right: 8 },
  selectCardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary, paddingRight: 20 },
  selectCardNameActive: { color: Colors.textPrimary },
  selectCardSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  selectCardPhone: { fontSize: FontSize.xs, color: Colors.neutralMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.neutralBorder, marginVertical: Spacing.sm },
  footer: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.neutralBorder,
  },
  backFooterBtn: {
    flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.neutralBorder,
  },
  backFooterText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
