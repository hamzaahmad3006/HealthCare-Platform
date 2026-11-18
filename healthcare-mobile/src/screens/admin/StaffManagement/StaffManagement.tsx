import type { JSX } from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout } from '../../../store/slices/authSlice';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/theme';

interface CustomerItem {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  createdAt: string;
}

interface StaffItem {
  userId: string;
  staffCode: string;
  verificationStatus: string;
  isAvailable: boolean;
  experienceYears: number;
  user: {
    fullName: string;
    phone: string;
    email: string | null;
  };
}

interface ConvertedResult {
  userId: string;
  staffCode: string;
  fullName: string;
  phone: string;
  email: string | null;
  tempPassword: string;
  delivery: {
    whatsapp: boolean;
    email: boolean;
  };
}

export function StaffManagement(): JSX.Element {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState<'convert' | 'staff'>('convert');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertingCustomerId, setConvertingCustomerId] = useState<string | null>(null);
  const [promotedCustomerIds, setPromotedCustomerIds] = useState<Record<string, boolean>>({});

  // Data lists
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);

  // Promotion success modal
  const [conversionSuccess, setConversionSuccess] = useState<ConvertedResult | null>(null);

  const fetchCustomers = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ success: true; data: CustomerItem[] }>(
        API.ADMIN.CUSTOMERS,
        { params: { search: query.trim() || undefined, limit: 20 } },
      );
      setCustomers(data.data || []);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ success: true; data: StaffItem[] }>(
        API.STAFF.LIST,
        { params: { limit: 25 } },
      );
      setStaffList(data.data || []);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'convert') {
      void fetchCustomers(searchQuery);
    } else {
      void fetchStaff();
    }
  }, [activeTab, fetchCustomers, fetchStaff, searchQuery]);

  const handlePromote = (customer: CustomerItem) => {
    Alert.alert(
      'Promote Customer to Staff',
      `Upgrade ${customer.fullName} (${customer.email ?? customer.phone}) to a Healthcare Staff account? They will receive an email and login password.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          style: 'default',
          onPress: async () => {
            setIsConverting(true);
            setConvertingCustomerId(customer.id);
            try {
              const { data } = await api.post<{ success: true; data: ConvertedResult }>(
                API.STAFF.CONVERT_CUSTOMER,
                { userId: customer.id },
              );
              setPromotedCustomerIds((prev) => ({ ...prev, [customer.id]: true }));
              setConversionSuccess(data.data);
            } catch (err) {
              Alert.alert('Promotion Failed', extractApiError(err));
            } finally {
              setIsConverting(false);
              setConvertingCustomerId(null);
            }
          },
        },
      ],
    );
  };

  const shareCredentials = async () => {
    if (!conversionSuccess) return;
    try {
      await Share.share({
        message: `Welcome to HomeHealth Staff!\nName: ${conversionSuccess.fullName}\nStaff ID: ${conversionSuccess.staffCode}\nTemp Password: ${conversionSuccess.tempPassword}\nLogin at: http://localhost:5173/login`,
        title: 'HomeHealth Staff Credentials',
      });
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" />

      {/* Top Admin Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>HomeHealth Admin</Text>
          <Text style={styles.headerSub}>
            {currentUser?.fullName ?? 'Administrator'} · Staff Desk
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'convert' && styles.tabBtnActive]}
          onPress={() => setActiveTab('convert')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'convert' && styles.tabBtnTextActive]}>
            Convert Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'staff' && styles.tabBtnTextActive]}>
            Active Staff
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input for Convert Tab */}
      {activeTab === 'convert' && (
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search customer by name, email, phone…"
            placeholderTextColor={Colors.neutralMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              void fetchCustomers(text);
            }}
          />
        </View>
      )}

      {/* Content List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading data…</Text>
        </View>
      ) : activeTab === 'convert' ? (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No registered customers found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'Try searching with another term' : 'Registered customers will appear here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isThisConverting = convertingCustomerId === item.id;
            const isPromoted = Boolean(promotedCustomerIds[item.id]);
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.fullName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.customerName}>{item.fullName}</Text>
                    <Text style={styles.customerDetail}>
                      {item.email ?? 'No email'} · {item.phone}
                    </Text>
                    <Text style={styles.customerDate}>
                      Joined {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {isPromoted ? (
                  <View style={[styles.promoteBtn, { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.promoteBtnText, { color: '#065F46' }]}>
                      ✓ Promoted · Verification Email Sent
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.promoteBtn, isConverting && !isThisConverting && { opacity: 0.6 }]}
                    disabled={isConverting}
                    onPress={() => handlePromote(item)}
                  >
                    {isThisConverting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.promoteBtnText}>Promote to Staff</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={staffList}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No staff members found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { backgroundColor: Colors.primaryDark }]}>
                  <Text style={styles.avatarText}>
                    {item.user.fullName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.customerName}>{item.user.fullName}</Text>
                  <Text style={styles.staffCodeText}>{item.staffCode}</Text>
                  <Text style={styles.customerDetail}>
                    {item.user.phone} · {item.experienceYears} yrs exp
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.verificationStatus === 'VERIFIED'
                      ? styles.badgeVerified
                      : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.verificationStatus === 'VERIFIED'
                        ? styles.badgeTextVerified
                        : styles.badgeTextPending,
                    ]}
                  >
                    {item.verificationStatus}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Success Modal */}
      <Modal visible={!!conversionSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Customer Promoted to Staff!</Text>
            <Text style={styles.modalSub}>
              {conversionSuccess?.fullName} has been successfully upgraded to Healthcare Staff.
            </Text>

            <View style={styles.credentialsBox}>
              <Text style={styles.credLabel}>Staff ID:</Text>
              <Text style={styles.credValue}>{conversionSuccess?.staffCode}</Text>

              <Text style={[styles.credLabel, { marginTop: Spacing.sm }]}>Temporary Password:</Text>
              <View style={styles.passwordPill}>
                <Text style={styles.passwordText}>{conversionSuccess?.tempPassword}</Text>
              </View>

              <Text style={styles.deliveryStatus}>
                Email: {conversionSuccess?.delivery.email ? '✅ Delivered' : '⚠️ Offline/Pending'} | WhatsApp: {conversionSuccess?.delivery.whatsapp ? '✅ Delivered' : '⚠️ Offline/Pending'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.shareBtn} onPress={shareCredentials}>
                <Text style={styles.shareBtnText}>Share Credentials</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setConversionSuccess(null)}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: '#D1FAE5',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  logoutBtnText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    margin: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.primaryDark,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  cardInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerDetail: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  customerDate: {
    fontSize: FontSize.xs,
    color: '#9CA3AF',
    marginTop: 2,
  },
  staffCodeText: {
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
    color: Colors.primaryDark,
    fontWeight: '700',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeVerified: {
    backgroundColor: '#ECFDF5',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextVerified: {
    color: '#065F46',
  },
  badgeTextPending: {
    color: '#92400E',
  },
  promoteBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  promoteBtnText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  credentialsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  credLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  credValue: {
    fontSize: FontSize.md,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  passwordPill: {
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    padding: Spacing.sm,
    marginTop: 4,
  },
  passwordText: {
    fontSize: FontSize.md,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  deliveryStatus: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  shareBtnText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  doneBtn: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  doneBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
