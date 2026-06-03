import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, Modal, TextInput, ScrollView,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface Patient {
  id: string;
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string;
  relationshipToCustomer?: string;
  primaryCondition?: string;
  allergies?: string;
}

const GENDER_LABEL: Record<Gender, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const RELATIONSHIPS = ['Self', 'Spouse', 'Son', 'Daughter', 'Mother', 'Father', 'Sibling', 'Other'];
const GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

function calcAge(dob?: string): string {
  if (!dob) return '';
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

export function MyPatients(): JSX.Element {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);

  // form state
  const [name, setName]         = useState('');
  const [gender, setGender]     = useState<Gender | ''>('');
  const [dob, setDob]           = useState('');
  const [relation, setRelation] = useState('');
  const [condition, setCondition] = useState('');
  const [allergies, setAllergies] = useState('');

  const openAdd = () => {
    setEditing(null);
    setName(''); setGender(''); setDob(''); setRelation(''); setCondition(''); setAllergies('');
    setModalOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    setName(p.fullName); setGender(p.gender ?? ''); setDob(p.dateOfBirth ?? '');
    setRelation(p.relationshipToCustomer ?? ''); setCondition(p.primaryCondition ?? '');
    setAllergies(p.allergies ?? '');
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editing) {
      setPatients((prev) => prev.map((p) =>
        p.id === editing.id
          ? { ...p, fullName: name, gender: gender || undefined, dateOfBirth: dob || undefined,
              relationshipToCustomer: relation || undefined, primaryCondition: condition || undefined,
              allergies: allergies || undefined }
          : p,
      ));
    } else {
      setPatients((prev) => [...prev, {
        id: Date.now().toString(), fullName: name, gender: gender || undefined,
        dateOfBirth: dob || undefined, relationshipToCustomer: relation || undefined,
        primaryCondition: condition || undefined, allergies: allergies || undefined,
      }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => setPatients((prev) => prev.filter((p) => p.id !== id));

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Patients</Text>
          <Text style={styles.headerSubtitle}>Manage family members for bookings.</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <MaterialDesignIcons name="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={patients.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialDesignIcons name="account-group" size={48} color={Colors.neutralBorder} />
            <Text style={styles.emptyTitle}>No patients yet</Text>
            <Text style={styles.emptyHint}>Add a family member to book services for them.</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAdd} activeOpacity={0.85}>
              <MaterialDesignIcons name="plus" size={16} color={Colors.white} />
              <Text style={styles.emptyAddText}>Add Patient</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardStrip} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={styles.cardAvatarRow}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.fullName}</Text>
                    {item.relationshipToCustomer ? (
                      <Text style={styles.cardRelation}>{item.relationshipToCustomer}</Text>
                    ) : null}
                  </View>
                </View>
                {item.gender ? (
                  <View style={styles.genderBadge}>
                    <Text style={styles.genderBadgeText}>{GENDER_LABEL[item.gender]}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.infoRows}>
                {item.dateOfBirth ? (
                  <View style={styles.infoRow}>
                    <MaterialDesignIcons name="calendar" size={13} color={Colors.neutralMuted} />
                    <Text style={styles.infoText}>{calcAge(item.dateOfBirth)} old</Text>
                  </View>
                ) : null}
                {item.primaryCondition ? (
                  <View style={styles.infoRow}>
                    <MaterialDesignIcons name="heart" size={13} color={Colors.danger} />
                    <Text style={styles.infoText} numberOfLines={1}>{item.primaryCondition}</Text>
                  </View>
                ) : null}
                {item.allergies ? (
                  <View style={styles.infoRow}>
                    <MaterialDesignIcons name="alert-circle" size={13} color={Colors.warning} />
                    <Text style={styles.infoText} numberOfLines={1}>Allergies: {item.allergies}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} activeOpacity={0.7}>
                  <MaterialDesignIcons name="pencil" size={14} color={Colors.textSecondary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
                  <MaterialDesignIcons name="trash-can" size={14} color={Colors.danger} />
                  <Text style={styles.deleteBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <MaterialDesignIcons name="account" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{editing ? 'Edit Patient' : 'Add Patient'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialDesignIcons name="close" size={22} color={Colors.neutral} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FormField label="Full Name *">
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Ahmed Khan" placeholderTextColor={Colors.neutralMuted} />
              </FormField>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.segmentRow}>
                    {GENDERS.map((g) => (
                      <TouchableOpacity key={g} style={[styles.segment, gender === g && styles.segmentActive]}
                        onPress={() => setGender(g)} activeOpacity={0.7}>
                        <Text style={[styles.segmentText, gender === g && styles.segmentTextActive]}>
                          {GENDER_LABEL[g]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <FormField label="Date of Birth (YYYY-MM-DD)">
                <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="e.g. 1990-05-20" placeholderTextColor={Colors.neutralMuted} />
              </FormField>

              <Text style={styles.fieldLabel}>Relationship</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {RELATIONSHIPS.map((r) => (
                  <TouchableOpacity key={r} style={[styles.chip, relation === r && styles.chipActive]}
                    onPress={() => setRelation(r)} activeOpacity={0.7}>
                    <Text style={[styles.chipText, relation === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <FormField label="Primary Condition">
                <TextInput style={styles.input} value={condition} onChangeText={setCondition} placeholder="e.g. Diabetes, Hypertension" placeholderTextColor={Colors.neutralMuted} />
              </FormField>

              <FormField label="Allergies">
                <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="e.g. Penicillin, Peanuts" placeholderTextColor={Colors.neutralMuted} />
              </FormField>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Add Patient'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.neutralLight },
  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyAddText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardStrip: { height: 4, backgroundColor: Colors.primary },
  cardBody: { padding: Spacing.md, gap: Spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardRelation: { fontSize: FontSize.xs, color: Colors.textMuted },
  genderBadge: {
    backgroundColor: Colors.neutralLight, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  genderBadgeText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  infoRows: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
  cardActions: {
    flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.neutralBorder,
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.neutralBorder,
  },
  editBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
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
  modalScroll: { flexGrow: 0 },
  modalScrollContent: { padding: Spacing.xl, gap: Spacing.md },
  formField: { gap: 6 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.neutralBorder, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12, fontSize: FontSize.md,
    color: Colors.textPrimary, backgroundColor: Colors.neutralLight,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  segmentRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  segment: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1.5,
    borderColor: Colors.neutralBorder, alignItems: 'center',
  },
  segmentActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySurface },
  segmentText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  segmentTextActive: { color: Colors.primary },
  chipsScroll: { marginTop: 6, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, marginRight: 6,
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
  saveBtn: {
    flex: 1, height: 48, borderRadius: Radius.lg, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
