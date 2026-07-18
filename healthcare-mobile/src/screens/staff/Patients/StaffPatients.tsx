import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { useStaffPatients } from './useStaffPatients';
import type { StaffPatient } from '../../../types/StaffPatients.types';

export function StaffPatients(): JSX.Element {
  const [search, setSearch] = useState('');
  const { patients, loading, refreshing, onRefresh } = useStaffPatients();

  const filtered = patients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Patients</Text>
        <Text style={styles.headerSubtitle}>Patients you have visited.</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <MaterialDesignIcons name="magnify" size={18} color={Colors.neutral} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor={Colors.neutralMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialDesignIcons name="close" size={16} color={Colors.neutral} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialDesignIcons name="account-group-outline" size={48} color={Colors.neutralBorder} />
              <Text style={styles.emptyTitle}>No patients yet</Text>
              <Text style={styles.emptyHint}>Patients from your assigned visits will appear here.</Text>
            </View>
          }
          renderItem={({ item }) => <PatientCard patient={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function PatientCard({ patient }: { patient: StaffPatient }) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{patient.fullName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{patient.fullName}</Text>
        {patient.primaryCondition ? (
          <View style={styles.conditionRow}>
            <MaterialDesignIcons name="heart-outline" size={12} color={Colors.danger} />
            <Text style={styles.condition}>{patient.primaryCondition}</Text>
          </View>
        ) : null}
        {patient.relationshipToCustomer ? (
          <Text style={styles.metaText}>{patient.relationshipToCustomer}</Text>
        ) : null}
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
  searchWrapper: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.neutralBorder,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.neutralLight,
    borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.neutralBorder,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, padding: 0 },
  listContent: { padding: Spacing.xl, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  info: { flex: 1, gap: 3 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  conditionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  condition: { fontSize: FontSize.xs, color: Colors.textMuted },
  metaText: { fontSize: FontSize.xs, color: Colors.neutralMuted },
});
