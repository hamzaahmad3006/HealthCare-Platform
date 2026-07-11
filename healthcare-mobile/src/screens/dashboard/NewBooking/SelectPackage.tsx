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
import type { Props } from '../../../types/SelectPackage.types';

function formatPrice(amount: string, currency: string): string {
  const n = Number(amount);
  return `${currency} ${Number.isNaN(n) ? amount : n.toLocaleString('en-PK')}`;
}

export function SelectPackage({ packages, loading, selectedId, onSelect, onBack, onNext }: Props): JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialDesignIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Package</Text>
        <View style={styles.headerRight} />
      </View>

      {/* ── Step indicator ── */}
      <View style={styles.stepRow}>
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <Text style={styles.stepName}>Package Selection</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      {/* ── Package cards ── */}
      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : packages.length === 0 ? (
        <View style={styles.centerFill}>
          <MaterialDesignIcons name="package-variant" size={44} color={Colors.neutralBorder} />
          <Text style={styles.emptyText}>No packages available right now.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {packages.map((pkg) => {
            const isSelected = selectedId === pkg.id;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => onSelect(pkg)}
                activeOpacity={0.85}
              >
                <Text style={styles.serviceLabel}>{pkg.serviceTypeName}</Text>

                {/* Card top row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardNameRow}>
                    <MaterialDesignIcons
                      name="medical-bag"
                      size={18}
                      color={isSelected ? Colors.primary : Colors.neutral}
                    />
                    <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>
                      {pkg.name}
                    </Text>
                  </View>
                  <Text style={styles.cardPrice}>{formatPrice(pkg.priceAmount, pkg.currency)}</Text>
                </View>

                {/* Tags row */}
                <View style={styles.tagsRow}>
                  <View style={styles.tag}>
                    <MaterialDesignIcons name="format-list-numbered" size={13} color={Colors.textMuted} />
                    <Text style={styles.tagText}>{pkg.visitCount} {pkg.visitCount === 1 ? 'Visit' : 'Visits'}</Text>
                  </View>
                  <View style={styles.tag}>
                    <MaterialDesignIcons name="update" size={13} color={Colors.textMuted} />
                    <Text style={styles.tagText}>Valid {pkg.durationDays} days</Text>
                  </View>
                </View>

                {/* Selected radio indicator */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Next Step button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedId && styles.nextBtnDisabled]}
          onPress={selectedId ? onNext : undefined}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Next Step</Text>
          <MaterialDesignIcons name="arrow-right" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 36,
  },

  /* Step */
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 6,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  stepName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.neutralBorder,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  progressFill: {
    width: '25%',
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },

  /* States */
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xl },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  serviceLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  nextBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },

  /* Scroll */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },

  /* Card */
  card: {
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  popularText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: '700',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  cardNameSelected: {
    color: Colors.textPrimary,
  },
  cardPrice: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  savingChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  savingText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
  },
  radio: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutralBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  /* Footer */
  footer: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralBorder,
  },
  nextBtn: {
    height: 52,
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
  nextBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
});
