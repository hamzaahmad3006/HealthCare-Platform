import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, SafeAreaView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

type Urgency = 'NORMAL' | 'URGENT' | 'EMERGENCY';
type Gender  = '' | 'MALE' | 'FEMALE' | 'OTHER';

const URGENCY_OPTIONS: { id: Urgency; label: string; color: string; bg: string }[] = [
  { id: 'NORMAL',    label: 'Normal',    color: Colors.primary,   bg: Colors.primarySurface },
  { id: 'URGENT',    label: 'Urgent',    color: Colors.warning,   bg: '#FFFBEB' },
  { id: 'EMERGENCY', label: 'Emergency', color: Colors.danger,    bg: '#FEF2F2' },
];

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: '',       label: 'No preference' },
  { id: 'MALE',   label: 'Male' },
  { id: 'FEMALE', label: 'Female' },
];

interface Props {
  onBack?: () => void;
  onNext?: () => void;
}

export function Step3DateTime({ onBack, onNext }: Props): JSX.Element {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]               = useState(today);
  const [time, setTime]               = useState('10:00');
  const [urgency, setUrgency]         = useState<Urgency>('NORMAL');
  const [gender, setGender]           = useState<Gender>('');
  const [instructions, setInstructions] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Date & Preferences</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Step bar */}
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
        <Text style={styles.stepName}>Date & Preferences</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '75%' }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Date & Time row */}
        <View style={styles.row2}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialDesignIcons name="calendar" size={14} color={Colors.primary} />
              <Text style={styles.label}>Preferred Date</Text>
            </View>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.neutralMuted}
            />
          </View>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MaterialDesignIcons name="clock-outline" size={14} color={Colors.primary} />
              <Text style={styles.label}>Preferred Time</Text>
            </View>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={Colors.neutralMuted}
            />
          </View>
        </View>

        {/* Urgency */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Urgency</Text>
          <View style={styles.urgencyRow}>
            {URGENCY_OPTIONS.map((u) => {
              const active = urgency === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.urgencyBtn, active && { backgroundColor: u.bg, borderColor: u.color }]}
                  onPress={() => setUrgency(u.id)}
                  activeOpacity={0.75}
                >
                  {u.id === 'EMERGENCY' && (
                    <MaterialDesignIcons name="alert" size={13} color={active ? u.color : Colors.textMuted} />
                  )}
                  <Text style={[styles.urgencyBtnText, active && { color: u.color }]}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preferred gender */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Preferred Staff Gender{' '}
            <Text style={styles.labelOptional}>(optional)</Text>
          </Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map((g) => {
              const active = gender === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.genderBtn, active && styles.genderBtnActive]}
                  onPress={() => setGender(g.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.genderBtnText, active && styles.genderBtnTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Special instructions */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Special Instructions{' '}
            <Text style={styles.labelOptional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Patient allergies, mobility needs, equipment available, etc."
            placeholderTextColor={Colors.neutralMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backFooterBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={18} color={Colors.textSecondary} />
          <Text style={styles.backFooterText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.lg },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  field: { flex: 1, gap: 6 },
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  labelOptional: { fontWeight: '400', color: Colors.neutralMuted },
  input: {
    borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.neutralLight,
  },
  urgencyRow: { flexDirection: 'row', gap: 8 },
  urgencyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.neutralBorder,
    backgroundColor: Colors.white,
  },
  urgencyBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.neutralBorder, backgroundColor: Colors.white,
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  genderBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  genderBtnTextActive: { color: Colors.primary },
  textArea: {
    borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.md,
    color: Colors.textPrimary, backgroundColor: Colors.neutralLight, minHeight: 100,
  },
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
  nextBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
