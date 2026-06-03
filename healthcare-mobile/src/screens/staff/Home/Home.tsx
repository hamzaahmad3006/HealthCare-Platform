import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

const LATER_PATIENTS = [
  { initials: 'SA', name: 'Sara Ahmed',      service: 'Post-op Care',    time: '6:00 PM' },
  { initials: 'MI', name: 'Mohammed Iqbal',  service: 'Routine Vitals',  time: '7:15 PM' },
];

export function StaffHome(): JSX.Element {
  const [onDuty, setOnDuty] = useState(true);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialDesignIcons name="account" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Care Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.staffId}>ID: HH-8821</Text>
          <TouchableOpacity
            style={[styles.dutyBadge, !onDuty && styles.dutyBadgeOff]}
            onPress={() => setOnDuty((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.dutyDot, !onDuty && styles.dutyDotOff]} />
            <Text style={[styles.dutyText, !onDuty && styles.dutyTextOff]}>
              {onDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ── */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Good morning, Dr. Ali</Text>
          <Text style={styles.greetingSubtitle}>Here is your schedule for today.</Text>
        </View>

        {/* ── On Duty toggle card ── */}
        <TouchableOpacity
          style={[styles.dutyCard, !onDuty && styles.dutyCardOff]}
          onPress={() => setOnDuty((v) => !v)}
          activeOpacity={0.85}
        >
          <View style={styles.dutyCardLeft}>
            <Text style={[styles.dutyCardTitle, !onDuty && styles.dutyCardTitleOff]}>
              {onDuty ? 'You are On Duty' : 'You are Off Duty'}
            </Text>
            <Text style={styles.dutyCardSubtitle}>
              {onDuty
                ? 'Ready to receive new patient requests.'
                : 'You will not receive new requests.'}
            </Text>
          </View>
          <MaterialDesignIcons
            name={onDuty ? 'toggle-switch' : 'toggle-switch-off'}
            size={40}
            color={onDuty ? Colors.primary : Colors.neutral}
          />
        </TouchableOpacity>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialDesignIcons name="calendar-today" size={22} color={Colors.primary} />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <MaterialDesignIcons name="check-circle" size={22} color={Colors.success} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Next Patient ── */}
        <Text style={styles.sectionTitle}>Next Patient</Text>
        <View style={styles.nextPatientCard}>
          {/* Patient info row */}
          <View style={styles.patientTopRow}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>Ahmed Khan</Text>
              <View style={styles.patientServiceRow}>
                <MaterialDesignIcons name="medical-bag" size={13} color={Colors.textMuted} />
                <Text style={styles.patientService}>General Checkup</Text>
              </View>
            </View>
            <View style={styles.patientTimeBox}>
              <Text style={styles.patientTime}>4:30 PM</Text>
              <Text style={styles.patientTimeHint}>in 45 mins</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.addressRow}>
            <MaterialDesignIcons name="map-marker" size={15} color={Colors.primary} />
            <View>
              <Text style={styles.addressStreet}>DHA Phase 5, Block L, Street 4</Text>
              <Text style={styles.addressCity}>Lahore, Punjab</Text>
            </View>
          </View>

          {/* Map placeholder */}
          <View style={styles.mapPlaceholder}>
            <MaterialDesignIcons name="map" size={32} color={Colors.primaryLight} />
            <Text style={styles.mapHint}>Map View</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <MaterialDesignIcons name="phone" size={18} color={Colors.primary} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.8}>
              <MaterialDesignIcons name="navigation" size={18} color={Colors.white} />
              <Text style={styles.navBtnText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Later Today ── */}
        <Text style={styles.sectionTitle}>Later Today</Text>
        <View style={styles.laterList}>
          {LATER_PATIENTS.map((p) => (
            <TouchableOpacity key={p.name} style={styles.laterRow} activeOpacity={0.8}>
              <View style={styles.laterAvatar}>
                <Text style={styles.laterInitials}>{p.initials}</Text>
              </View>
              <View style={styles.laterInfo}>
                <Text style={styles.laterName}>{p.name}</Text>
                <Text style={styles.laterService}>{p.service} • {p.time}</Text>
              </View>
              <MaterialDesignIcons name="chevron-right" size={22} color={Colors.neutralMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  staffId: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  dutyBadgeOff: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dutyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  dutyDotOff: {
    backgroundColor: Colors.neutralMuted,
  },
  dutyText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  dutyTextOff: {
    color: 'rgba(255,255,255,0.6)',
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 32,
    gap: Spacing.md,
  },

  /* Greeting */
  greeting: { gap: 2 },
  greetingTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  greetingSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },

  /* On Duty card */
  dutyCard: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  dutyCardOff: {
    backgroundColor: Colors.neutralLight,
    borderColor: Colors.neutralBorder,
  },
  dutyCardLeft: { flex: 1 },
  dutyCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  dutyCardTitleOff: { color: Colors.textSecondary },
  dutyCardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  /* Stats */
  statsRow: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.neutralBorder,
    marginVertical: 4,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* Next Patient card */
  nextPatientCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: Spacing.sm,
  },
  patientTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: { gap: 4 },
  patientName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  patientServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  patientService: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  patientTimeBox: {
    alignItems: 'flex-end',
  },
  patientTime: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  patientTimeHint: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  addressStreet: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  addressCity: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  mapPlaceholder: {
    height: 100,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.neutralBorder,
  },
  mapHint: {
    fontSize: FontSize.xs,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  callBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  callBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  navBtn: {
    flex: 2,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
  },
  navBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },

  /* Later Today */
  laterList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  laterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralBorder,
  },
  laterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterInitials: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  laterInfo: { flex: 1 },
  laterName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  laterService: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
