import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, SafeAreaView, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useAccount } from './useAccount';

export function Account(): JSX.Element {
  const {
    user,
    fullName, setFullName, savingProfile, saveProfile,
    oldPwd, setOldPwd, newPwd, setNewPwd, confirmPwd, setConfirmPwd,
    updatingPwd, updatePassword,
    addresses, loadingAddresses,
    cities, citiesLoading, citiesError, reloadCities, addingAddress, createAddress,
    signOut,
  } = useAccount();
  const [showOld, setShowOld]           = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Add-address modal
  const [addrOpen, setAddrOpen]     = useState(false);
  const [aLabel, setALabel]         = useState('');
  const [aName, setAName]           = useState('');
  const [aPhone, setAPhone]         = useState('');
  const [aLine1, setALine1]         = useState('');
  const [aLine2, setALine2]         = useState('');
  const [aArea, setAArea]           = useState('');
  const [aCityId, setACityId]       = useState<string | null>(null);
  const [aZoneId, setAZoneId]       = useState<string | null>(null);

  const email = user?.email ?? '—';
  const phone = user?.phone ?? '—';

  const openAddress = () => {
    setALabel(''); setAName(user?.fullName ?? ''); setAPhone(user?.phone ?? '');
    setALine1(''); setALine2(''); setAArea('');
    setACityId(null); setAZoneId(null);
    if (citiesError || cities.length === 0) reloadCities();
    setAddrOpen(true);
  };

  const saveAddress = async () => {
    const ok = await createAddress({
      label: aLabel, contactName: aName, contactPhone: aPhone,
      line1: aLine1, line2: aLine2, area: aArea, cityId: aCityId, zoneId: aZoneId,
    });
    if (ok) setAddrOpen(false);
  };

  const selectedCity = cities.find((c) => c.id === aCityId) ?? null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your profile and password.</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile card ── */}
        <View style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <View style={styles.sectionIconBox}>
              <MaterialDesignIcons name="account" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.cardSectionTitle}>Profile</Text>
              <Text style={styles.cardSectionSubtitle}>Your name and contact details</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <MaterialDesignIcons name="account-outline" size={16} color={Colors.neutral} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={Colors.neutralMuted}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.readonlyRow}>
              <MaterialDesignIcons name="email-outline" size={16} color={Colors.neutral} style={styles.inputIcon} />
              <Text style={styles.readonlyText}>{email}</Text>
              <Text style={styles.readonlyNote}>Cannot be changed</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.readonlyRow}>
              <MaterialDesignIcons name="phone-outline" size={16} color={Colors.neutral} style={styles.inputIcon} />
              <Text style={styles.readonlyText}>{phone}</Text>
              <Text style={styles.readonlyNote}>Cannot be changed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingProfile && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={saveProfile}
            disabled={savingProfile}
          >
            <MaterialDesignIcons name="content-save" size={16} color={Colors.white} />
            <Text style={styles.saveBtnText}>{savingProfile ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Saved Addresses card ── */}
        <View style={styles.card}>
          <View style={styles.cardSectionHeaderRow}>
            <View style={styles.cardSectionHeaderLeft}>
              <View style={[styles.sectionIconBox, { backgroundColor: Colors.primarySurface }]}>
                <MaterialDesignIcons name="map-marker-outline" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardSectionTitle}>Saved Addresses</Text>
                <Text style={styles.cardSectionSubtitle}>Home, clinic, or delivery locations</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.smallAddBtn} activeOpacity={0.8} onPress={openAddress}>
              <MaterialDesignIcons name="plus" size={16} color={Colors.white} />
              <Text style={styles.smallAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
            <View style={styles.emptyAddressBox}>
              <Text style={styles.emptyAddressText}>Loading addresses…</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyAddressBox}>
              <Text style={styles.emptyAddressText}>No addresses saved yet.</Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {addresses.map((a) => (
                <View key={a.id} style={styles.addressRow}>
                  <MaterialDesignIcons name="map-marker" size={18} color={Colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addressLabel}>{a.label || a.contactName}</Text>
                    <Text style={styles.addressLine} numberOfLines={1}>
                      {[a.line1, a.line2, a.area].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Change Password card ── */}
        <View style={styles.card}>
          <View style={styles.cardSectionHeader}>
            <View style={[styles.sectionIconBox, { backgroundColor: Colors.neutralLight }]}>
              <MaterialDesignIcons name="key-variant" size={20} color={Colors.neutral} />
            </View>
            <View>
              <Text style={styles.cardSectionTitle}>Change Password</Text>
              <Text style={styles.cardSectionSubtitle}>At least 8 characters</Text>
            </View>
          </View>

          <PasswordField label="Current Password" value={oldPwd} onChange={setOldPwd} show={showOld} onToggle={() => setShowOld(v => !v)} />
          <PasswordField label="New Password" value={newPwd} onChange={setNewPwd} show={showNew} onToggle={() => setShowNew(v => !v)} />
          <PasswordField label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />

          <TouchableOpacity
            style={[styles.saveBtn, updatingPwd && styles.btnDisabled]}
            activeOpacity={0.85}
            onPress={updatePassword}
            disabled={updatingPwd}
          >
            <MaterialDesignIcons name="key-variant" size={16} color={Colors.white} />
            <Text style={styles.saveBtnText}>{updatingPwd ? 'Updating…' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.85} onPress={signOut}>
          <MaterialDesignIcons name="logout" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add Address Modal ── */}
      <Modal visible={addrOpen} animationType="slide" transparent onRequestClose={() => setAddrOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <MaterialDesignIcons name="map-marker-plus" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Add Address</Text>
              <TouchableOpacity onPress={() => setAddrOpen(false)}>
                <MaterialDesignIcons name="close" size={22} color={Colors.neutral} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Label (optional)</Text>
                <TextInput style={styles.addrInput} value={aLabel} onChangeText={setALabel} maxLength={50}
                  placeholder="e.g. Home, Clinic" placeholderTextColor={Colors.neutralMuted} />
              </View>

              {/* City */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>City *</Text>
                {citiesLoading ? (
                  <Text style={styles.mutedNote}>Loading cities…</Text>
                ) : citiesError || cities.length === 0 ? (
                  <TouchableOpacity onPress={reloadCities} activeOpacity={0.7}>
                    <Text style={styles.retryNote}>Couldn't load cities — tap to retry</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.chipWrap}>
                    {cities.map((c) => {
                      const active = aCityId === c.id;
                      return (
                        <TouchableOpacity key={c.id} style={[styles.chip, active && styles.chipActive]}
                          onPress={() => { setACityId(c.id); setAZoneId(null); }} activeOpacity={0.75}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Zone (optional) */}
              {selectedCity && selectedCity.zones.length > 0 ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Zone (optional)</Text>
                  <View style={styles.chipWrap}>
                    {selectedCity.zones.map((z) => {
                      const active = aZoneId === z.id;
                      return (
                        <TouchableOpacity key={z.id} style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setAZoneId(active ? null : z.id)} activeOpacity={0.75}>
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{z.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contact Name *</Text>
                <TextInput style={styles.addrInput} value={aName} onChangeText={setAName} maxLength={150}
                  placeholder="Full name" placeholderTextColor={Colors.neutralMuted} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contact Phone *</Text>
                <TextInput style={styles.addrInput} value={aPhone} onChangeText={setAPhone} maxLength={20}
                  placeholder="+92 300 1234567" keyboardType="phone-pad" placeholderTextColor={Colors.neutralMuted} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Address Line 1 *</Text>
                <TextInput style={styles.addrInput} value={aLine1} onChangeText={setALine1} maxLength={255}
                  placeholder="House / street" placeholderTextColor={Colors.neutralMuted} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Area *</Text>
                <TextInput style={styles.addrInput} value={aArea} onChangeText={setAArea} maxLength={120}
                  placeholder="e.g. DHA Phase 5" placeholderTextColor={Colors.neutralMuted} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Address Line 2 (optional)</Text>
                <TextInput style={styles.addrInput} value={aLine2} onChangeText={setALine2} maxLength={255}
                  placeholder="Apartment, landmark" placeholderTextColor={Colors.neutralMuted} />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddrOpen(false)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, addingAddress && { opacity: 0.6 }]}
                onPress={saveAddress}
                disabled={addingAddress}
                activeOpacity={0.85}
              >
                {addingAddress ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <MaterialDesignIcons name="lock-outline" size={16} color={Colors.neutral} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={Colors.neutralMuted}
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} activeOpacity={0.7}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.neutral} />
        </TouchableOpacity>
      </View>
    </View>
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
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.md, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardSectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardSectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionIconBox: {
    width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardSectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardSectionSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  fieldGroup: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.neutralBorder,
    borderRadius: Radius.md, backgroundColor: Colors.neutralLight, overflow: 'hidden',
  },
  inputIcon: { marginLeft: 12 },
  input: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 13,
    fontSize: FontSize.md, color: Colors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: 12, justifyContent: 'center' },
  readonlyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md, backgroundColor: Colors.neutralLight,
  },
  readonlyText: { flex: 1, fontSize: FontSize.md, color: Colors.textMuted },
  readonlyNote: { fontSize: FontSize.xs, color: Colors.neutralMuted },
  saveBtn: {
    height: 48, backgroundColor: Colors.primary, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  btnDisabled: { opacity: 0.6 },
  addressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: Colors.neutralBorder, borderRadius: Radius.md, backgroundColor: Colors.neutralLight,
  },
  addressLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  addressLine: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  smallAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 6,
  },
  smallAddText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.white },
  emptyAddressBox: { paddingVertical: 8 },
  emptyAddressText: { fontSize: FontSize.sm, color: Colors.neutralMuted, textAlign: 'center' },
  logoutBtn: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#FEF2F2', borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: '#FECACA',
  },
  logoutText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.danger },

  /* Add-address modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  modalIconBox: {
    width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  modalScroll: { flexGrow: 0, flexShrink: 1 },
  modalScrollContent: { padding: Spacing.xl, gap: Spacing.md },
  addrInput: {
    borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.md,
    color: Colors.textPrimary, backgroundColor: Colors.neutralLight,
  },
  mutedNote: { fontSize: FontSize.sm, color: Colors.neutralMuted },
  retryNote: { fontSize: FontSize.sm, color: Colors.danger, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.neutralBorder, backgroundColor: Colors.white,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  chipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  chipTextActive: { color: Colors.primary },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.neutralBorder,
  },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.neutralBorder, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  modalSaveBtn: {
    flex: 1, height: 48, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalSaveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
