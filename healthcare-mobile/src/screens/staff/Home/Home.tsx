import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useStaffHome } from './useStaffHome';

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' });
}

function minutesUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return 'now';
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `in ${mins} min${mins === 1 ? '' : 's'}`;
  return `in ${Math.round(mins / 60)} hr${Math.round(mins / 60) === 1 ? '' : 's'}`;
}

export function StaffHome(): JSX.Element {
  const {
    loading, todayCount, completedCount, nextPatient, laterToday,
    available, togglingDuty, toggleDuty, staffCode, fullName,
  } = useStaffHome();
  const onDuty = available;

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
          <Text style={styles.staffId}>{staffCode ? `ID: ${staffCode}` : ''}</Text>
          <TouchableOpacity
            style={[styles.dutyBadge, !onDuty && styles.dutyBadgeOff]}
            onPress={toggleDuty}
            disabled={togglingDuty}
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
          <Text style={styles.greetingTitle}>Hello, {fullName.trim().split(/\s+/)[0]}</Text>
          <Text style={styles.greetingSubtitle}>Here is your schedule for today.</Text>
        </View>

        {/* ── On Duty toggle card ── */}
        <TouchableOpacity
          style={[styles.dutyCard, !onDuty && styles.dutyCardOff]}
          onPress={toggleDuty}
          disabled={togglingDuty}
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
            <Text style={styles.statValue}>{loading ? '—' : todayCount}</Text>
            <Text style={styles.statLabel}>Today's Visits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <MaterialDesignIcons name="check-circle" size={22} color={Colors.success} />
            <Text style={styles.statValue}>{loading ? '—' : completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ── Next Patient ── */}
        <Text style={styles.sectionTitle}>Next Patient</Text>
        {loading ? (
          <View style={[styles.nextPatientCard, styles.centeredBox]}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : nextPatient ? (
          <View style={styles.nextPatientCard}>
            {/* Patient info row */}
            <View style={styles.patientTopRow}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{nextPatient.patientName}</Text>
                <View style={styles.patientServiceRow}>
                  <MaterialDesignIcons name="medical-bag" size={13} color={Colors.textMuted} />
                  <Text style={styles.patientService}>{nextPatient.serviceLabel}</Text>
                </View>
              </View>
              <View style={styles.patientTimeBox}>
                <Text style={styles.patientTime}>{formatTime(nextPatient.scheduledStartAt)}</Text>
                <Text style={styles.patientTimeHint}>{minutesUntil(nextPatient.scheduledStartAt)}</Text>
              </View>
            </View>

            {/* Address */}
            {nextPatient.addressLine && (
              <View style={styles.addressRow}>
                <MaterialDesignIcons name="map-marker" size={15} color={Colors.primary} />
                <View>
                  <Text style={styles.addressStreet}>{nextPatient.addressLine}</Text>
                  {nextPatient.addressCity && <Text style={styles.addressCity}>{nextPatient.addressCity}</Text>}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.nextPatientCard, styles.centeredBox]}>
            <MaterialDesignIcons name="calendar-check" size={28} color={Colors.primaryLight} />
            <Text style={styles.emptyText}>No more visits scheduled today.</Text>
          </View>
        )}

        {/* ── Later Today ── */}
        {laterToday.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Later Today</Text>
            <View style={styles.laterList}>
              {laterToday.map((v) => (
                <View key={v.id} style={styles.laterRow}>
                  <View style={styles.laterAvatar}>
                    <Text style={styles.laterInitials}>{initialsOf(v.patientName)}</Text>
                  </View>
                  <View style={styles.laterInfo}>
                    <Text style={styles.laterName}>{v.patientName}</Text>
                    <Text style={styles.laterService}>{v.serviceLabel} • {formatTime(v.scheduledStartAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
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
  centeredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
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
