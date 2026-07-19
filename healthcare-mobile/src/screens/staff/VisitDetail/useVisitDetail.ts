import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { StaffStackParamList } from '../../../navigation/types';
import type { ApiVisit } from '../../../types/visit.types';
import type { BookingDetail } from '../../../types/booking.types';
import type { ReportType, PresignResult, AllowedReportFileMimeType } from '../../../types/report.types';
import { ALLOWED_REPORT_FILE_MIME_TYPES } from '../../../types/report.types';
import { serviceLabelFromCode } from '../../../utils/format';
import { getCurrentCoords } from '../../../utils/location';

type Nav = NativeStackNavigationProp<StaffStackParamList, 'VisitDetail'>;
type VisitDetailRouteProp = RouteProp<StaffStackParamList, 'VisitDetail'>;

interface PickedFile {
  uri: string;
  name: string;
  type: AllowedReportFileMimeType;
  size: number;
}

export const REPORT_TYPE_OPTIONS: { id: ReportType; label: string }[] = [
  { id: 'VISIT_NOTE',     label: 'Visit Note' },
  { id: 'LAB_RESULT',     label: 'Lab Result' },
  { id: 'PRESCRIPTION',   label: 'Prescription' },
  { id: 'PROGRESS_IMAGE', label: 'Progress Image' },
  { id: 'OTHER',          label: 'Other' },
];

export function useVisitDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<VisitDetailRouteProp>();
  const { id } = route.params;

  const [visit, setVisit] = useState<ApiVisit | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [beforeCondition, setBeforeCondition] = useState('');
  const [afterCondition, setAfterCondition] = useState('');
  const [visitNotes, setVisitNotes] = useState('');

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>('VISIT_NOTE');
  const [reportNotes, setReportNotes] = useState('');
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data: visitRes } = await api.get<{ success: true; data: ApiVisit }>(API.VISITS.DETAIL(id));
      setVisit(visitRes.data);
      setBeforeCondition(visitRes.data.beforeConditionText ?? '');
      setAfterCondition(visitRes.data.afterConditionText ?? '');
      setVisitNotes(visitRes.data.visitNotes ?? '');

      const { data: bookingRes } = await api.get<{ success: true; data: BookingDetail }>(
        API.BOOKINGS.DETAIL(visitRes.data.bookingId),
      );
      setBooking(bookingRes.data);
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const reloadVisit = async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiVisit }>(API.VISITS.DETAIL(id));
      setVisit(data.data);
    } catch {
      // Non-fatal — keeps showing the last known state.
    }
  };

  const markEnRoute = async (): Promise<void> => {
    setActionLoading(true);
    try {
      await api.patch(API.VISITS.EN_ROUTE(id));
      await reloadVisit();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const checkIn = async (): Promise<void> => {
    setActionLoading(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert('Location required', 'Could not get your location. Enable GPS and try again.');
        return;
      }
      await api.patch(API.VISITS.CHECK_IN(id), {
        checkInLatitude: coords.latitude,
        checkInLongitude: coords.longitude,
        ...(beforeCondition.trim() ? { beforeConditionText: beforeCondition.trim() } : {}),
      });
      await reloadVisit();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const checkOut = async (): Promise<void> => {
    setActionLoading(true);
    try {
      const coords = await getCurrentCoords();
      await api.patch(API.VISITS.CHECK_OUT(id), {
        ...(coords ? { checkOutLatitude: coords.latitude, checkOutLongitude: coords.longitude } : {}),
        ...(afterCondition.trim() ? { afterConditionText: afterCondition.trim() } : {}),
        ...(visitNotes.trim() ? { visitNotes: visitNotes.trim() } : {}),
      });
      await reloadVisit();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const completeVisit = async (): Promise<void> => {
    setActionLoading(true);
    try {
      await api.patch(API.VISITS.COMPLETE(id));
      await reloadVisit();
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openReportModal = (): void => {
    setReportTitle('');
    setReportType('VISIT_NOTE');
    setReportNotes('');
    setPickedFile(null);
    setReportModalVisible(true);
  };

  const closeReportModal = (): void => setReportModalVisible(false);

  const pickReportFile = async (): Promise<void> => {
    try {
      const [result] = await pick({ type: [types.pdf, types.images], mode: 'open' });
      if (!result.type || !ALLOWED_REPORT_FILE_MIME_TYPES.includes(result.type as AllowedReportFileMimeType)) {
        Alert.alert('Unsupported file', 'Please choose a PDF, JPEG, or PNG file.');
        return;
      }
      if (result.size == null) {
        Alert.alert('Error', 'Could not read the file size. Please try a different file.');
        return;
      }
      setPickedFile({
        uri: result.uri,
        name: result.name ?? 'attachment',
        type: result.type as AllowedReportFileMimeType,
        size: result.size,
      });
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Error', 'Could not open the file picker.');
      }
    }
  };

  const submitReport = async (): Promise<boolean> => {
    if (!visit || !booking) return false;
    if (!reportTitle.trim()) {
      Alert.alert('Required', 'Please enter a report title.');
      return false;
    }
    if (!pickedFile) {
      Alert.alert('Required', 'Please attach a file.');
      return false;
    }
    if (!booking.patient) {
      Alert.alert('Error', 'This booking has no patient on file.');
      return false;
    }

    setReportSubmitting(true);
    try {
      const { data: createRes } = await api.post<{ success: true; data: { id: string } }>(API.REPORTS.CREATE, {
        bookingId: visit.bookingId,
        bookingVisitId: visit.id,
        patientId: booking.patient.id,
        reportType,
        title: reportTitle.trim(),
        notes: reportNotes.trim() || undefined,
        isVisibleToCustomer: true,
      });
      const reportId = createRes.data.id;

      const { data: presignRes } = await api.post<{ success: true; data: PresignResult }>(
        API.REPORTS.FILES_PRESIGN(reportId),
        { mimeType: pickedFile.type, fileSizeBytes: pickedFile.size },
      );
      const { uploadUrl, fileKey, uploadParams } = presignRes.data;

      const formData = new FormData();
      // RN's fetch/FormData implementation accepts { uri, type, name } as a file part.
      formData.append('file', { uri: pickedFile.uri, type: pickedFile.type, name: pickedFile.name } as unknown as Blob);
      formData.append('api_key', uploadParams.api_key);
      formData.append('timestamp', String(uploadParams.timestamp));
      formData.append('signature', uploadParams.signature);
      formData.append('public_id', uploadParams.public_id);

      const uploadResp = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!uploadResp.ok) throw new Error('File upload to storage failed.');
      const uploaded = (await uploadResp.json()) as { secure_url: string };

      await api.post(API.REPORTS.FILES_CONFIRM(reportId), {
        fileKey,
        fileUrl: uploaded.secure_url,
        mimeType: pickedFile.type,
        fileSizeBytes: pickedFile.size,
      });

      Alert.alert('Report uploaded', 'The customer can now view this report.');
      setReportModalVisible(false);
      return true;
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
      return false;
    } finally {
      setReportSubmitting(false);
    }
  };

  const patientName = booking?.patient?.fullName ?? visit?.booking.bookingNumber ?? '—';
  const serviceLabel = visit ? serviceLabelFromCode(visit.booking.serviceType.code) : '—';
  const addressLine = booking?.address ? `${booking.address.line1}, ${booking.address.area}` : null;
  const addressCity = booking?.city?.name ?? null;

  return {
    visit,
    booking,
    loading,
    actionLoading,
    patientName,
    serviceLabel,
    addressLine,
    addressCity,
    beforeCondition,
    afterCondition,
    visitNotes,
    setBeforeCondition,
    setAfterCondition,
    setVisitNotes,
    markEnRoute,
    checkIn,
    checkOut,
    completeVisit,
    goBack: () => navigation.goBack(),
    reportModalVisible,
    openReportModal,
    closeReportModal,
    reportTitle,
    setReportTitle,
    reportType,
    setReportType,
    reportNotes,
    setReportNotes,
    pickedFile,
    pickReportFile,
    reportSubmitting,
    submitReport,
  };
}
