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
  ScrollView,
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

interface AuditPayload {
  valuesOmitted?: boolean;
  fieldCount?: number;
  actionCode?: string;
  operation?: string;
  category?: 'CLINICAL' | 'BOOKING' | 'SECURITY' | 'STAFF' | 'PATIENT' | 'SYSTEM';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  endpoint?: string;
  changedFields?: string[];
  statusCode?: number;
  hipaaRedacted?: boolean;
  deviceTag?: string;
  locationTag?: string;
}

interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: AuditPayload | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { fullName: string; role: string } | null;
}

interface SecurityAlertItem {
  id: string;
  title: string;
  message: string;
  ipAddress: string;
  attemptCount: number;
  lastSeenAt: string;
  severity: 'CRITICAL' | 'WARNING';
}

interface AuditSummary {
  totalEvents: number;
  todayEvents: number;
  clinicalBookingEvents: number;
  securityEvents: number;
  securityAlerts?: SecurityAlertItem[];
}

const AUDIT_ENTITY_CHIPS = [
  { value: '', label: 'All Entities' },
  { value: 'BOOKING', label: 'Bookings' },
  { value: 'VISIT', label: 'Visits' },
  { value: 'PATIENT', label: 'Patients' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'USER', label: 'Users' },
  { value: 'DEVICE_TOKEN', label: 'Devices' },
  { value: 'SECURITY', label: 'Security Watch' },
];

const AUDIT_ROLE_CHIPS = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SYSTEM', label: 'System' },
];

const DATE_PRESET_CHIPS = [
  { value: 'all', label: '📅 All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Dates' },
] as const;

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function StaffManagement(): JSX.Element {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState<'convert' | 'staff' | 'audit'>('convert');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertingCustomerId, setConvertingCustomerId] = useState<string | null>(null);
  const [promotedCustomerIds, setPromotedCustomerIds] = useState<Record<string, boolean>>({});

  // Data lists
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary>({
    totalEvents: 0,
    todayEvents: 0,
    clinicalBookingEvents: 0,
    securityEvents: 0,
    securityAlerts: [],
  });
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [auditRoleFilter, setAuditRoleFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7d' | 'month' | 'custom'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedAuditIds, setExpandedAuditIds] = useState<Record<string, boolean>>({});
  const [quickViewRecord, setQuickViewRecord] = useState<{
    title: string;
    subtitle: string;
    details: Array<{ label: string; value: string }>;
    canJumpToTab?: 'convert' | 'staff';
    jumpQuery?: string;
  } | null>(null);

  // Promotion success modal
  const [conversionSuccess, setConversionSuccess] = useState<ConvertedResult | null>(null);

  const applyDatePreset = (preset: 'all' | 'today' | '7d' | 'month' | 'custom') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = toYmd(now);
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setFromDate(toYmd(d));
      setToDate(todayStr);
    } else if (preset === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(toYmd(d));
      setToDate(todayStr);
    }
  };

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

  const fetchAuditLogs = useCallback(
    async (
      entity: string,
      role: string,
      search: string,
      from: string,
      to: string,
      silent = false,
    ) => {
      if (!silent) setIsLoading(true);
      try {
        const { data } = await api.get<{
          success: true;
          data: AuditLogItem[];
          summary?: AuditSummary;
        }>(API.ADMIN.AUDIT_LOGS, {
          params: {
            limit: 40,
            entityType: entity || undefined,
            role: role || undefined,
            search: search.trim() || undefined,
            fromDate: from.trim() || undefined,
            toDate: to.trim() || undefined,
          },
        });
        setAuditLogs(data.data || []);
        if (data.summary) {
          setAuditSummary(data.summary);
        }
      } catch (err) {
        if (!silent) Alert.alert('Error', extractApiError(err));
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (activeTab === 'convert') {
      void fetchCustomers(searchQuery);
    } else if (activeTab === 'staff') {
      void fetchStaff();
    } else {
      void fetchAuditLogs(auditEntityFilter, auditRoleFilter, auditSearch, fromDate, toDate, false);
    }
  }, [
    activeTab,
    fetchCustomers,
    fetchStaff,
    fetchAuditLogs,
    searchQuery,
    auditEntityFilter,
    auditRoleFilter,
    auditSearch,
    fromDate,
    toDate,
  ]);

  // Real-time background poll for security alerts when viewing Audit tab
  useEffect(() => {
    if (activeTab !== 'audit') return;
    const interval = setInterval(() => {
      void fetchAuditLogs(auditEntityFilter, auditRoleFilter, auditSearch, fromDate, toDate, true);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTab, fetchAuditLogs, auditEntityFilter, auditRoleFilter, auditSearch, fromDate, toDate]);

  const handleQuickClickToView = async (item: AuditLogItem) => {
    const p = item.payload ?? {};
    const baseDetails: Array<{ label: string; value: string }> = [
      { label: 'Operation', value: p.operation ?? `${item.action} ${item.entityType}` },
      { label: 'Action Code', value: p.actionCode ?? item.action },
      { label: 'Actor', value: `${item.actor?.fullName ?? 'Automated System'} (${item.actor?.role ?? 'SYSTEM'})` },
      { label: 'Target Entity', value: `${item.entityType} (${item.entityId})` },
      { label: 'Endpoint', value: p.endpoint ?? `${item.action} /${item.entityType.toLowerCase()}` },
      { label: 'Device & Platform', value: p.deviceTag ?? 'Mobile / Web Client' },
      { label: 'Location & IP', value: `${p.locationTag ?? 'Faisalabad HQ'} · ${item.ipAddress ?? '—'}` },
      { label: 'Timestamp', value: new Date(item.createdAt).toLocaleString() },
    ];

    const canJumpToStaff =
      item.entityType === 'STAFF' || item.actor?.role === 'STAFF';
    const canJumpToCustomer =
      item.entityType === 'PATIENT' ||
      item.entityType === 'BOOKING' ||
      item.actor?.role === 'CUSTOMER';

    // If it's a BOOKING with a valid UUID, try fetching live booking summary
    if (item.entityType === 'BOOKING' && item.entityId && item.entityId !== 'unknown') {
      try {
        const { data } = await api.get<{
          success: true;
          data: {
            bookingNumber?: string;
            status?: string;
            scheduledAt?: string;
            totalAmount?: string | number;
            patient?: { fullName?: string };
            serviceType?: { name?: string };
          };
        }>(API.BOOKINGS.DETAIL(item.entityId));
        if (data?.data) {
          const b = data.data;
          baseDetails.unshift(
            { label: 'Booking Number', value: b.bookingNumber ?? item.entityId.slice(0, 8) },
            { label: 'Live Status', value: b.status ?? 'ACTIVE' },
            { label: 'Patient', value: b.patient?.fullName ?? 'Protected PHI' },
            { label: 'Service', value: b.serviceType?.name ?? 'Clinical Service' },
          );
        }
      } catch {
        // Fallback to audit metadata if booking no longer exists
      }
    }

    setQuickViewRecord({
      title: `${item.entityType} Record Inspector`,
      subtitle: p.operation ?? 'Audit Linked Resource',
      details: baseDetails,
      canJumpToTab: canJumpToStaff ? 'staff' : canJumpToCustomer ? 'convert' : undefined,
      jumpQuery: item.actor?.fullName ?? '',
    });
  };

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

  const exportAuditCsvReport = async () => {
    if (auditLogs.length === 0) return;
    try {
      const header =
        'Timestamp,Actor,Role,Operation,Code,Entity,Endpoint,Device,Location,Status,IP,HIPAA_Safe';
      const lines = auditLogs.slice(0, 30).map((item) => {
        const p = item.payload ?? {};
        const actorName = (item.actor?.fullName ?? 'System').replace(/,/g, ' ');
        const actorRole = item.actor?.role ?? 'SYSTEM';
        const op = (p.operation ?? `${item.action} ${item.entityType}`).replace(/,/g, ' ');
        const code = p.actionCode ?? item.action;
        const ep = p.endpoint ?? '';
        const dev = (p.deviceTag ?? 'Mobile/Web').replace(/,/g, ' ');
        const loc = (p.locationTag ?? 'Faisalabad HQ').replace(/,/g, ' ');
        const st = p.statusCode ?? 200;
        const ip = item.ipAddress ?? '';
        return `${new Date(item.createdAt).toISOString()},${actorName},${actorRole},${op},${code},${item.entityType},${ep},${dev},${loc},${st},${ip},YES_PHI_OMITTED`;
      });
      await Share.share({
        title: 'HomeHealth HIPAA Audit Log Report',
        message: [header, ...lines].join('\n'),
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

  const toggleExpandAudit = (id: string) => {
    setExpandedAuditIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeAlerts = auditSummary.securityAlerts ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primaryDark} barStyle="light-content" />

      {/* Top Admin Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>HomeHealth Admin</Text>
          <Text style={styles.headerSub}>
            {currentUser?.fullName ?? 'Administrator'} · Security &amp; Staff Console
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
            Convert User
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
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'audit' && styles.tabBtnActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'audit' && styles.tabBtnTextActive]}>
            Audit Logs {activeAlerts.length > 0 ? `🚨` : ''}
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

      {/* Audit Logs Controls & KPI Cards */}
      {activeTab === 'audit' && (
        <View style={styles.auditHeaderWrap}>
          {/* Real-Time Red Security Alert Banner */}
          {activeAlerts.map((alert) => (
            <View key={alert.id} style={styles.redAlertBanner}>
              <View style={styles.redAlertHeader}>
                <Text style={styles.redAlertTitle}>{alert.title}</Text>
                <TouchableOpacity
                  style={styles.redAlertBtn}
                  onPress={() => {
                    setAuditSearch(alert.ipAddress);
                    setAuditEntityFilter('SECURITY');
                  }}
                >
                  <Text style={styles.redAlertBtnText}>Filter IP</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.redAlertBody}>{alert.message}</Text>
            </View>
          ))}

          {/* 4 KPI Summary Cards */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
              <Text style={styles.kpiLabel}>TOTAL EVENTS</Text>
              <Text style={styles.kpiValue}>{auditSummary.totalEvents.toLocaleString()}</Text>
              <Text style={styles.kpiHint}>HIPAA Ledger</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.kpiLabel}>TODAY</Text>
              <Text style={[styles.kpiValue, { color: '#047857' }]}>
                {auditSummary.todayEvents.toLocaleString()}
              </Text>
              <Text style={styles.kpiHint}>24h Activity</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: '#2563EB' }]}>
              <Text style={styles.kpiLabel}>CLINICAL</Text>
              <Text style={[styles.kpiValue, { color: '#1D4ED8' }]}>
                {auditSummary.clinicalBookingEvents.toLocaleString()}
              </Text>
              <Text style={styles.kpiHint}>Care &amp; Visits</Text>
            </View>
            <View style={[styles.kpiCard, { borderLeftColor: activeAlerts.length > 0 ? '#DC2626' : '#D97706' }]}>
              <Text style={styles.kpiLabel}>SECURITY</Text>
              <Text style={[styles.kpiValue, { color: activeAlerts.length > 0 ? '#DC2626' : '#B45309' }]}>
                {auditSummary.securityEvents.toLocaleString()}
              </Text>
              <Text style={styles.kpiHint}>
                {activeAlerts.length > 0 ? `${activeAlerts.length} Red Alert!` : '0 Threats'}
              </Text>
            </View>
          </View>

          {/* Search & Export CSV Row */}
          <View style={styles.auditSearchRow}>
            <TextInput
              style={[styles.searchInput, { flex: 1 }]}
              placeholder="Search actor, IP, entity or action…"
              placeholderTextColor={Colors.neutralMuted}
              value={auditSearch}
              onChangeText={(txt) => setAuditSearch(txt)}
            />
            <TouchableOpacity style={styles.exportCsvBtn} onPress={exportAuditCsvReport}>
              <Text style={styles.exportCsvText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Date Range Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {DATE_PRESET_CHIPS.map((chip) => {
              const active = datePreset === chip.value;
              return (
                <TouchableOpacity
                  key={chip.value}
                  style={[styles.filterChip, active && styles.filterChipDateActive]}
                  onPress={() => applyDatePreset(chip.value)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Custom From -> To Date Inputs */}
          {datePreset === 'custom' && (
            <View style={styles.customDateRow}>
              <TextInput
                style={styles.dateInput}
                placeholder="From (YYYY-MM-DD)"
                placeholderTextColor={Colors.neutralMuted}
                value={fromDate}
                onChangeText={setFromDate}
              />
              <Text style={styles.dateArrow}>→</Text>
              <TextInput
                style={styles.dateInput}
                placeholder="To (YYYY-MM-DD)"
                placeholderTextColor={Colors.neutralMuted}
                value={toDate}
                onChangeText={setToDate}
              />
            </View>
          )}

          {/* Role Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {AUDIT_ROLE_CHIPS.map((chip) => {
              const active = auditRoleFilter === chip.value;
              return (
                <TouchableOpacity
                  key={chip.value || 'all-roles'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setAuditRoleFilter(chip.value)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Entity Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {AUDIT_ENTITY_CHIPS.map((chip) => {
              const active = auditEntityFilter === chip.value;
              return (
                <TouchableOpacity
                  key={chip.value || 'all-entities'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setAuditEntityFilter(chip.value)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
      ) : activeTab === 'staff' ? (
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
      ) : (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No audit logs found</Text>
              <Text style={styles.emptySub}>Try clearing date range, role, or search filters</Text>
            </View>
          }
          renderItem={({ item }) => {
            const p = item.payload ?? {};
            const operation = p.operation ?? `${item.action} ${item.entityType}`;
            const actionCode = p.actionCode ?? item.action;
            const severity = p.severity ?? 'INFO';
            const endpoint = p.endpoint ?? `${item.action} /${item.entityType.toLowerCase()}`;
            const statusCode = p.statusCode ?? 200;
            const fieldCount = p.fieldCount ?? 0;
            const changedFields = Array.isArray(p.changedFields) ? p.changedFields : [];
            const deviceTag = p.deviceTag ?? 'Mobile / Web Client';
            const locationTag = p.locationTag ?? 'Faisalabad HQ';
            const isExpanded = Boolean(expandedAuditIds[item.id]);
            const actorRole = item.actor?.role ?? 'SYSTEM';
            const isCritical =
              severity === 'CRITICAL' ||
              item.action === 'DELETE' ||
              item.action === 'LOGIN_FAILED' ||
              item.action === 'SUSPICIOUS_ACTIVITY';
            const isWarning = severity === 'WARNING';

            return (
              <View
                style={[
                  styles.card,
                  isCritical && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                ]}
              >
                {/* Top Row: Operation Badge & Timestamp */}
                <View style={styles.auditTopRow}>
                  <View
                    style={[
                      styles.auditCodeBadge,
                      isCritical
                        ? { backgroundColor: '#FEE2E2' }
                        : isWarning
                        ? { backgroundColor: '#FEF3C7' }
                        : { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.auditCodeText,
                        isCritical
                          ? { color: '#991B1B' }
                          : isWarning
                          ? { color: '#92400E' }
                          : { color: '#065F46' },
                      ]}
                    >
                      {actionCode}
                    </Text>
                  </View>

                  <Text style={styles.auditTimestamp}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>

                {/* Operation Title */}
                <Text style={styles.auditOperationTitle}>{operation}</Text>

                {/* Actor & Target Entity Row */}
                <View style={styles.auditMetaRow}>
                  <View style={styles.auditActorPill}>
                    <Text style={styles.auditActorName}>
                      {item.actor?.fullName ?? 'Automated System'}
                    </Text>
                    <Text style={styles.auditRoleTag}>{actorRole}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.quickLinkPill}
                    onPress={() => void handleQuickClickToView(item)}
                  >
                    <Text style={styles.quickLinkText}>
                      🔗 {item.entityType}{' '}
                      {item.entityId && item.entityId !== 'unknown'
                        ? `#${item.entityId.slice(0, 6)}`
                        : 'Inspect →'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Device & Location Tag Row */}
                <View style={styles.deviceLocationRow}>
                  <View style={styles.deviceTagPill}>
                    <Text style={styles.deviceTagText}>📱 {deviceTag}</Text>
                  </View>
                  <View style={styles.locationTagPill}>
                    <Text style={styles.locationTagText}>📍 {locationTag}</Text>
                  </View>
                </View>

                {/* Bottom Row: IP & Safe Payload Toggle */}
                <View style={styles.auditFooterRow}>
                  <Text style={styles.auditIpText}>
                    IP: {item.ipAddress ?? '—'} · {item.action}
                  </Text>
                  <TouchableOpacity
                    style={styles.safePayloadBtn}
                    onPress={() => toggleExpandAudit(item.id)}
                  >
                    <Text style={styles.safePayloadBtnText}>
                      {isExpanded
                        ? '▲ Hide Safe Payload'
                        : `🔒 Safe Summary (${fieldCount} fields)`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Expandable HIPAA Safe Payload Box */}
                {isExpanded && (
                  <View style={styles.safePayloadBox}>
                    <View style={styles.safePayloadHeader}>
                      <Text style={styles.safeEndpointText}>{endpoint}</Text>
                      <Text
                        style={[
                          styles.safeStatusBadge,
                          statusCode >= 400
                            ? { color: '#991B1B', backgroundColor: '#FEE2E2' }
                            : { color: '#065F46', backgroundColor: '#D1FAE5' },
                        ]}
                      >
                        HTTP {statusCode}
                      </Text>
                    </View>

                    {changedFields.length > 0 ? (
                      <View style={styles.fieldsWrap}>
                        <Text style={styles.fieldsLabel}>Touched Fields:</Text>
                        <View style={styles.fieldsBadgeRow}>
                          {changedFields.map((f) => (
                            <View key={f} style={styles.fieldChip}>
                              <Text style={styles.fieldChipText}>{f}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.fieldsLabel}>
                        Payload Field Count: {fieldCount}
                      </Text>
                    )}

                    <Text style={styles.hipaaSafeNote}>
                      ✓ HIPAA Compliant (SRS §11.6): Clinical &amp; PHI values omitted
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Quick Click-to-View Entity Inspector Modal */}
      <Modal visible={!!quickViewRecord} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔗 {quickViewRecord?.title}</Text>
            <Text style={styles.modalSub}>{quickViewRecord?.subtitle}</Text>

            <View style={styles.credentialsBox}>
              {quickViewRecord?.details.map((d) => (
                <View key={d.label} style={styles.inspectRow}>
                  <Text style={styles.inspectLabel}>{d.label}:</Text>
                  <Text style={styles.inspectValue}>{d.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalActions}>
              {quickViewRecord?.canJumpToTab && (
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => {
                    const targetTab = quickViewRecord.canJumpToTab!;
                    const q = quickViewRecord.jumpQuery ?? '';
                    setQuickViewRecord(null);
                    if (targetTab === 'convert' && q) {
                      setSearchQuery(q);
                    }
                    setActiveTab(targetTab);
                  }}
                >
                  <Text style={styles.shareBtnText}>
                    Open {quickViewRecord.canJumpToTab === 'staff' ? 'Staff Directory' : 'Customer Desk'} →
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setQuickViewRecord(null)}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    fontSize: FontSize.xs,
    fontWeight: '700',
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
  auditHeaderWrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  redAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: Spacing.sm,
  },
  redAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    flex: 1,
  },
  redAlertBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  redAlertBtnText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  redAlertBody: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 3,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  kpiValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  kpiHint: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  auditSearchRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  exportCsvBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportCsvText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  chipScroll: {
    gap: 6,
    paddingVertical: 3,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipDateActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  dateArrow: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
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
  auditTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  auditCodeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  auditTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  auditOperationTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
  },
  auditMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  auditActorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditActorName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  auditRoleTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  quickLinkPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  deviceLocationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  deviceTagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deviceTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  locationTagPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  auditFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  auditIpText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  safePayloadBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safePayloadBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  safePayloadBox: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  safePayloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  safeEndpointText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#1F2937',
  },
  safeStatusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fieldsWrap: {
    marginTop: 2,
  },
  fieldsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  fieldsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  fieldChip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fieldChipText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#374151',
  },
  hipaaSafeNote: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    marginTop: 8,
  },
  inspectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inspectLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  inspectValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    maxWidth: '62%',
    textAlign: 'right',
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
