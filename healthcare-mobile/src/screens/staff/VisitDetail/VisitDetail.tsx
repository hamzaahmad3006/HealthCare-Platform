import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import type { DocFieldProps } from '../../../types/VisitDetail.types';
import type { StaffStackParamList } from '../../../navigation/types';
import { Colors, FontSize, Spacing, Radius } from '../../../constants/theme';
import { VISIT_STATUS_COLOR, VISIT_STATUS_LABEL } from '../../../constants/visitStatus';
import { useUnreadBadge } from '../../shared/Notifications/useUnreadBadge';
import { useVisitDetail, REPORT_TYPE_OPTIONS } from './useVisitDetail';
import type { VisitStatus } from '../../../types/visit.types';

type Nav = NativeStackNavigationProp<StaffStackParamList>;

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

export function VisitDetail(): JSX.Element {
  const navigation = useNavigation<Nav>();
  const unreadCount = useUnreadBadge();
  const {
    visit, booking, loading, actionLoading,
    patientName, serviceLabel, addressLine, addressCity,
    beforeCondition, afterCondition, visitNotes,
    setBeforeCondition, setAfterCondition, setVisitNotes,
    markEnRoute, checkIn, checkOut, completeVisit,
    reportModalVisible, openReportModal, closeReportModal,
    reportTitle, setReportTitle, reportType, setReportType, reportNotes, setReportNotes,
    pickedFile, pickReportFile, reportSubmitting, submitReport,
  } = useVisitDetail();

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={[styles.root, styles.centered]}>
        <Text style={styles.notFound}>Visit not found.</Text>
      </SafeAreaView>
    );
  }

  const status: VisitStatus = visit.status;
  const statusColor = VISIT_STATUS_COLOR[status];
  const isTerminal = status === 'COMPLETED' || status === 'MISSED' || status === 'CANCELLED';
  const canEditBefore = status === 'ASSIGNED' || status === 'EN_ROUTE';
  const canEditAfter = status === 'CHECKED_IN' && !visit.checkOutAt;
  const canUploadReport = status === 'CHECKED_IN' || status === 'COMPLETED';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <MaterialDesignIcons name="account" size={20} color={Colors.primary} />
          </View>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Patient info ── */}
        <View style={styles.patientSection}>
          <Text style={styles.patientName}>{patientName}</Text>
          <View style={styles.patientMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{VISIT_STATUS_LABEL[status]}</Text>
            </View>
            <Text style={styles.patientService}>{serviceLabel}{booking ? ` — ${booking.bookingNumber}` : ''}</Text>
          </View>
        </View>

        {/* ── Info rows ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialDesignIcons name="clock-outline" size={18} color={Colors.primary} />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Scheduled Time</Text>
              <Text style={styles.infoValue}>{formatScheduled(visit.scheduledStartAt)}</Text>
            </View>
          </View>
          {addressLine && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <MaterialDesignIcons name="map-marker" size={18} color={Colors.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{addressLine}{addressCity ? `, ${addressCity}` : ''}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ── Primary lifecycle action ── */}
        {!isTerminal && (
          <PrimaryAction
            status={status}
            checkedOut={!!visit.checkOutAt}
            actionLoading={actionLoading}
            onEnRoute={markEnRoute}
            onCheckIn={checkIn}
            onCheckOut={checkOut}
            onComplete={completeVisit}
          />
        )}
        {isTerminal && (
          <View style={[styles.infoCard, styles.terminalBanner]}>
            <MaterialDesignIcons
              name={status === 'COMPLETED' ? 'check-circle' : 'close-circle'}
              size={20}
              color={statusColor}
            />
            <Text style={[styles.terminalText, { color: statusColor }]}>
              This visit is {VISIT_STATUS_LABEL[status].toLowerCase()}.
            </Text>
          </View>
        )}

        {/* ── Clinical Documentation ── */}
        <Text style={styles.sectionTitle}>Clinical Documentation</Text>

        <View style={styles.docCard}>
          <DocField
            label="Before Condition"
            subtitle="Initial assessment upon arrival."
            placeholder="Enter vitals and initial observations..."
            value={beforeCondition}
            onChange={setBeforeCondition}
            editable={canEditBefore}
          />

          <View style={styles.fieldDivider} />

          <DocField
            label="After Condition"
            subtitle="Post-visit assessment and patient status."
            placeholder="Enter post-treatment observations..."
            value={afterCondition}
            onChange={setAfterCondition}
            editable={canEditAfter}
          />

          <View style={styles.fieldDivider} />

          <DocField
            label="Visit Notes"
            subtitle="General clinical notes and recommendations."
            placeholder="Enter detailed visit notes..."
            value={visitNotes}
            onChange={setVisitNotes}
            editable={canEditAfter}
          />
        </View>

        {/* ── Upload Report button ── */}
        <TouchableOpacity
          style={[styles.uploadBtn, !canUploadReport && styles.uploadBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canUploadReport}
          onPress={openReportModal}
        >
          <MaterialDesignIcons name="upload" size={20} color={canUploadReport ? Colors.primary : Colors.neutralMuted} />
          <Text style={[styles.uploadBtnText, !canUploadReport && styles.uploadBtnTextDisabled]}>
            Upload Report
          </Text>
        </TouchableOpacity>
        {!canUploadReport && (
          <Text style={styles.uploadHint}>Available once you've checked in to the visit.</Text>
        )}
      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={closeReportModal}
        title={reportTitle}
        onTitleChange={setReportTitle}
        reportType={reportType}
        onReportTypeChange={setReportType}
        notes={reportNotes}
        onNotesChange={setReportNotes}
        pickedFileName={pickedFile?.name ?? null}
        onPickFile={pickReportFile}
        submitting={reportSubmitting}
        onSubmit={submitReport}
      />
    </SafeAreaView>
  );
}

/* ── Contextual primary action per visit stage ── */
function PrimaryAction({
  status, checkedOut, actionLoading, onEnRoute, onCheckIn, onCheckOut, onComplete,
}: {
  status: VisitStatus;
  checkedOut: boolean;
  actionLoading: boolean;
  onEnRoute: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onComplete: () => void;
}) {
  let icon = 'car';
  let label = 'Mark En Route';
  let onPress = onEnRoute;

  if (status === 'EN_ROUTE') {
    icon = 'login';
    label = 'Check In';
    onPress = onCheckIn;
  } else if (status === 'CHECKED_IN' && !checkedOut) {
    icon = 'logout';
    label = 'Check Out';
    onPress = onCheckOut;
  } else if (status === 'CHECKED_IN' && checkedOut) {
    icon = 'check-circle-outline';
    label = 'Complete Visit';
    onPress = onComplete;
  }

  return (
    <TouchableOpacity style={styles.enRouteBtn} activeOpacity={0.85} onPress={onPress} disabled={actionLoading}>
      {actionLoading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <>
          <MaterialDesignIcons name={icon} size={20} color={Colors.white} />
          <Text style={styles.enRouteBtnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/* ── Doc field sub-component ── */
function DocField({ label, subtitle, placeholder, value, onChange, editable = true }: DocFieldProps & { editable?: boolean }) {
  return (
    <View style={styles.docField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldSubtitle}>{subtitle}</Text>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutralMuted}
        multiline
        numberOfLines={3}
        value={value}
        onChangeText={onChange}
        editable={editable}
        textAlignVertical="top"
      />
    </View>
  );
}

/* ── Upload Report modal ── */
function ReportModal({
  visible, onClose, title, onTitleChange, reportType, onReportTypeChange,
  notes, onNotesChange, pickedFileName, onPickFile, submitting, onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  onTitleChange: (v: string) => void;
  reportType: string;
  onReportTypeChange: (v: (typeof REPORT_TYPE_OPTIONS)[number]['id']) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  pickedFileName: string | null;
  onPickFile: () => void;
  submitting: boolean;
  onSubmit: () => Promise<boolean>;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Report</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <MaterialDesignIcons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Blood Pressure Reading"
              placeholderTextColor={Colors.neutralMuted}
              value={title}
              onChangeText={onTitleChange}
            />

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.chipsRow}>
              {REPORT_TYPE_OPTIONS.map((opt) => {
                const active = reportType === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => onReportTypeChange(opt.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Additional context for this report..."
              placeholderTextColor={Colors.neutralMuted}
              value={notes}
              onChangeText={onNotesChange}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.8} onPress={onPickFile}>
              <MaterialDesignIcons name="paperclip" size={18} color={Colors.primary} />
              <Text style={styles.attachBtnText} numberOfLines={1}>
                {pickedFileName ?? 'Attach file (PDF, JPG, PNG)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={submitting}
              onPress={onSubmit}
            >
              {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.neutralLight,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: FontSize.md, color: Colors.textMuted },

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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Patient */
  patientSection: { gap: 6 },
  patientName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  patientService: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
  },

  /* Info card */
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.neutralBorder,
    marginVertical: 10,
  },
  terminalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  terminalText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  /* En Route / lifecycle button */
  enRouteBtn: {
    height: 50,
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
  enRouteBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },

  /* Section title */
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  /* Doc card */
  docCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 0,
  },
  docField: { gap: 4 },
  fieldLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fieldSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  fieldInput: {
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.neutralLight,
    minHeight: 80,
  },
  fieldInputDisabled: {
    color: Colors.textMuted,
    backgroundColor: Colors.neutralBorder + '33',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.neutralBorder,
    marginVertical: Spacing.md,
  },

  /* Upload button */
  uploadBtn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  uploadBtnDisabled: {
    borderColor: Colors.neutralBorder,
  },
  uploadBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadBtnTextDisabled: {
    color: Colors.neutralMuted,
  },
  uploadHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },

  /* Report modal */
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
    maxHeight: '85%',
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
  modalTextArea: {
    minHeight: 80,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.neutralBorder,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  attachBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  attachBtnText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
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
