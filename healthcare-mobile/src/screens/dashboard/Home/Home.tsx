import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

const SERVICES = [
  { icon: 'bandage',                   label: 'Nursing' },
  { icon: 'human-handshelp',           label: 'Caregiver' },
  { icon: 'flask',                     label: 'Lab Sampling' },
  { icon: 'stethoscope',               label: 'Visiting Doctor' },
  { icon: 'human-wheelchair',          label: 'Physiotherapy' },
  { icon: 'ambulance',                 label: 'Ambulance' },
];

export function Home(): JSX.Element {
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialDesignIcons name="account" size={22} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.greetingText}>Good morning,</Text>
            <Text style={styles.greetingName}>Ahmed</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
          <MaterialDesignIcons name="bell-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Next Appointment ── */}
        <Text style={styles.sectionTitle}>Next Appointment</Text>
        <View style={styles.appointmentCard}>
          <View style={styles.apptTop}>
            <View style={styles.apptServiceRow}>
              <MaterialDesignIcons name="medical-bag" size={16} color={Colors.primary} />
              <Text style={styles.apptServiceLabel}>Home Nursing</Text>
            </View>
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedText}>Confirmed</Text>
            </View>
          </View>

          <Text style={styles.apptNurseName}>Nurse Sarah</Text>

          <View style={styles.apptTimeRow}>
            <MaterialDesignIcons name="clock-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.apptTime}>Today, 4:00 PM</Text>
          </View>

          <View style={styles.apptActions}>
            <TouchableOpacity style={styles.viewDetailsBtn} activeOpacity={0.8}>
              <Text style={styles.viewDetailsTxt}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <MaterialDesignIcons name="phone" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Our Services ── */}
        <View style={styles.serviceHeader}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map((s) => (
            <TouchableOpacity key={s.label} style={styles.serviceItem} activeOpacity={0.75}>
              <View style={styles.serviceIconBg}>
                <MaterialDesignIcons name={s.icon} size={26} color={Colors.primary} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '400',
  },
  greetingName: {
    fontSize: FontSize.xl,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 26,
  },
  notifBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 32,
    gap: Spacing.sm,
  },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  /* Appointment card */
  appointmentCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 10,
  },
  apptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apptServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apptServiceLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  confirmedBadge: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  confirmedText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  apptNurseName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  apptTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  apptTime: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  apptActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  viewDetailsBtn: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsTxt: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Services */
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  serviceItem: {
    width: '30.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceIconBg: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
