import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout } from '../../../store/slices/authSlice';

const SPECIALIZATIONS = ['Nursing', 'Caregiver'];

function initialsOf(name?: string): string {
  if (!name) return '–';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

export function StaffProfile(): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [available, setAvailable] = useState(true);

  const signOut = (): void => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { dispatch(logout()); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialDesignIcons name="medical-bag" size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>HomeHealth Pakistan</Text>
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
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initialsOf(user?.fullName)}</Text>
          </View>

          <Text style={styles.profileName}>{user?.fullName ?? 'Staff Member'}</Text>
          <Text style={styles.profileId}>ID: {user?.id ? user.id.slice(0, 8).toUpperCase() : '—'}</Text>

          {/* Phone */}
          <View style={styles.phoneRow}>
            <MaterialDesignIcons name="phone" size={15} color={Colors.primary} />
            <Text style={styles.phoneText}>{user?.phone ?? '—'}</Text>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <MaterialDesignIcons name="check-decagram" size={14} color={Colors.primary} />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            <View style={styles.badge}>
              <MaterialDesignIcons name="timer-outline" size={14} color={Colors.primary} />
              <Text style={styles.badgeText}>5 Years Experience</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <MaterialDesignIcons name="map-marker-outline" size={15} color={Colors.textMuted} />
            <Text style={styles.locationText}>Lahore, DHA Zone L</Text>
          </View>
        </View>

        {/* ── Specializations ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specializations</Text>
          <View style={styles.chipsRow}>
            {SPECIALIZATIONS.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.settingsCard}>
          {/* Availability */}
          <View style={styles.settingRow}>
            <View style={styles.settingIconBox}>
              <MaterialDesignIcons name="calendar-check" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Availability</Text>
              <Text style={styles.settingSubtitle}>Currently accepting visits</Text>
            </View>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: Colors.neutralBorder, true: Colors.primaryLight }}
              thumbColor={available ? Colors.primary : Colors.neutralMuted}
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Change Password */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconBox}>
              <MaterialDesignIcons name="lock-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingSubtitle}>Update your security credentials</Text>
            </View>
            <MaterialDesignIcons name="chevron-right" size={22} color={Colors.neutralMuted} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Help & Support */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconBox}>
              <MaterialDesignIcons name="help-circle-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingSubtitle}>Contact admin for assistance</Text>
            </View>
            <MaterialDesignIcons name="chevron-right" size={22} color={Colors.neutralMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={signOut}>
          <MaterialDesignIcons name="logout" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
    gap: 8,
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

  /* Profile card */
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySurface,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitials: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.primary,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileId: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  phoneText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },

  /* Specializations */
  section: { gap: 10 },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },

  /* Settings card */
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.neutralBorder,
    marginLeft: Spacing.md + 36 + Spacing.sm,
  },

  /* Logout */
  logoutBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.danger,
  },
});
