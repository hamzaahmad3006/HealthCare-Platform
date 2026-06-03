import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

export function VisitDetail(): JSX.Element {
  const [beforeCondition, setBeforeCondition] = useState('');
  const [afterCondition, setAfterCondition]   = useState('');
  const [visitNotes, setVisitNotes]           = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialDesignIcons name="account" size={20} color={Colors.primary} />
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.headerTitle}>HomeHealth Pakistan</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
          <MaterialDesignIcons name="bell-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Patient info ── */}
        <View style={styles.patientSection}>
          <Text style={styles.patientName}>Ahmed Khan</Text>
          <View style={styles.patientMeta}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>In Progress</Text>
            </View>
            <Text style={styles.patientService}>General Checkup - Post-op Recovery</Text>
          </View>
        </View>

        {/* ── Info rows ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialDesignIcons name="clock-outline" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Scheduled Time</Text>
              <Text style={styles.infoValue}>4:30 PM (Today)</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <MaterialDesignIcons name="map-marker" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>DHA Phase 5, Block L, Street 4, Lahore</Text>
            </View>
          </View>
        </View>

        {/* ── Mark En Route button ── */}
        <TouchableOpacity style={styles.enRouteBtn} activeOpacity={0.85}>
          <MaterialDesignIcons name="car" size={20} color={Colors.white} />
          <Text style={styles.enRouteBtnText}>Mark En Route</Text>
        </TouchableOpacity>

        {/* ── Clinical Documentation ── */}
        <Text style={styles.sectionTitle}>Clinical Documentation</Text>

        <View style={styles.docCard}>
          {/* Before Condition */}
          <DocField
            label="Before Condition"
            subtitle="Initial assessment upon arrival."
            placeholder="Enter vitals and initial observations..."
            value={beforeCondition}
            onChange={setBeforeCondition}
          />

          <View style={styles.fieldDivider} />

          {/* After Condition */}
          <DocField
            label="After Condition"
            subtitle="Post-visit assessment and patient status."
            placeholder="Enter post-treatment observations..."
            value={afterCondition}
            onChange={setAfterCondition}
          />

          <View style={styles.fieldDivider} />

          {/* Visit Notes */}
          <DocField
            label="Visit Notes"
            subtitle="General clinical notes and recommendations."
            placeholder="Enter detailed visit notes..."
            value={visitNotes}
            onChange={setVisitNotes}
          />
        </View>

        {/* ── Upload Report button ── */}
        <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.85}>
          <MaterialDesignIcons name="upload" size={20} color={Colors.primary} />
          <Text style={styles.uploadBtnText}>Upload Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Doc field sub-component ── */
interface DocFieldProps {
  label:       string;
  subtitle:    string;
  placeholder: string;
  value:       string;
  onChange:    (v: string) => void;
}

function DocField({ label, subtitle, placeholder, value, onChange }: DocFieldProps) {
  return (
    <View style={styles.docField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldSubtitle}>{subtitle}</Text>
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutralMuted}
        multiline
        numberOfLines={3}
        value={value}
        onChangeText={onChange}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutralLight,
  },

  /* Header */
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
  },

  /* Patient */
  patientSection: { gap: 6 },
  patientName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#D97706',
  },
  patientService: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },

  /* Info card */
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.neutralBorder,
    marginVertical: 10,
  },

  /* En Route button */
  enRouteBtn: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  enRouteBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* Doc card */
  docCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 0,
  },
  docField: { gap: 4 },
  fieldLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fieldSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  fieldInput: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.neutralLight,
    minHeight: 80,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.neutralBorder,
    marginVertical: Spacing.md,
  },

  /* Upload button */
  uploadBtn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  uploadBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
});
