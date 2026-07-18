import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Switch,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useUnreadBadge } from '../../shared/Notifications/useUnreadBadge';
import { useStaffProfile } from './useStaffProfile';
import type { StaffStackParamList } from '../../../navigation/types';

type Nav = NativeStackNavigationProp<StaffStackParamList>;

const SPECIALIZATIONS = ['Nursing', 'Caregiver'];

function initialsOf(name?: string): string {
  if (!name) return '–';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');
}

export function StaffProfile(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const unreadCount = useUnreadBadge();
  const {
    user, staffCode, experienceYears, locationLabel, verified, available, togglingDuty, toggleDuty,
    passwordModalVisible, openPasswordModal, closePasswordModal,
    oldPwd, setOldPwd, newPwd, setNewPwd, confirmPwd, setConfirmPwd,
    updatingPwd, updatePassword,
    signOut,
  } = useStaffProfile();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialDesignIcons name="medical-bag" size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>HomeHealth Pakistan</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Notifications')}>
          <MaterialDesignIcons name="bell-outline" size={24} color={Colors.white} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initialsOf(user?.fullName)}</Text>
          </View>

          <Text style={styles.profileName}>{user?.fullName ?? 'Staff Member'}</Text>
          <Text style={styles.profileId}>ID: {staffCode ?? (user?.id ? user.id.slice(0, 8).toUpperCase() : '—')}</Text>

          <View style={styles.phoneRow}>
            <MaterialDesignIcons name="phone" size={15} color={Colors.primary} />
            <Text style={styles.phoneText}>{user?.phone ?? '—'}</Text>
          </View>

          <View style={styles.badgesRow}>
            {verified && (
              <View style={styles.badge}>
                <MaterialDesignIcons name="check-decagram" size={14} color={Colors.primary} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
            {experienceYears != null && (
              <View style={styles.badge}>
                <MaterialDesignIcons name="timer-outline" size={14} color={Colors.primary} />
                <Text style={styles.badgeText}>{experienceYears} {experienceYears === 1 ? 'Year' : 'Years'} Experience</Text>
              </View>
            )}
          </View>

          {locationLabel && (
            <View style={styles.locationRow}>
              <MaterialDesignIcons name="map-marker-outline" size={15} color={Colors.textMuted} />
              <Text style={styles.locationText}>{locationLabel}</Text>
            </View>
          )}
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
              <Text style={styles.settingSubtitle}>
                {available ? 'Currently accepting visits' : 'Not accepting visits'}
              </Text>
            </View>
            {togglingDuty ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Switch
                value={available}
                onValueChange={toggleDuty}
                trackColor={{ false: Colors.neutralBorder, true: Colors.primaryLight }}
                thumbColor={available ? Colors.primary : Colors.neutralMuted}
              />
            )}
          </View>

          <View style={styles.rowDivider} />

          {/* Change Password */}
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={openPasswordModal}>
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

      {/* ── Change Password modal ── */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent onRequestClose={closePasswordModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={closePasswordModal} activeOpacity={0.7}>
                <MaterialDesignIcons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={oldPwd}
              onChangeText={setOldPwd}
              placeholder="Enter current password"
              placeholderTextColor={Colors.neutralMuted}
            />

            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPwd}
              onChangeText={setNewPwd}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.neutralMuted}
            />

            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              placeholder="Re-enter new password"
              placeholderTextColor={Colors.neutralMuted}
            />

            <TouchableOpacity
              style={[styles.submitBtn, updatingPwd && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={updatingPwd}
              onPress={updatePassword}
            >
              {updatingPwd ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
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
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
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

  /* Change Password modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.neutralLight,
  },
  submitBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
