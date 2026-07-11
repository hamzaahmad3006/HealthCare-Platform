import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';

export type ReportType = 'LAB_RESULT' | 'PRESCRIPTION' | 'VISIT_NOTE' | 'PROGRESS_IMAGE' | 'OTHER';

export interface Report {
  id: string;
  title: string;
  reportType: ReportType;
  notes?: string;
  patientName?: string;
  bookingNumber?: string;
  createdAt: string;
  hasFile: boolean;
  fileUrl?: string;
}

interface ApiReport {
  id: string;
  title: string;
  reportType: ReportType;
  notes?: string | null;
  createdAt: string;
  patient?: { fullName: string } | null;
  booking?: { bookingNumber: string } | null;
  files?: { fileUrl: string }[];
}

function mapReport(r: ApiReport): Report {
  return {
    id: r.id,
    title: r.title,
    reportType: r.reportType,
    notes: r.notes ?? undefined,
    patientName: r.patient?.fullName,
    bookingNumber: r.booking?.bookingNumber,
    createdAt: r.createdAt,
    hasFile: !!r.files && r.files.length > 0,
    fileUrl: r.files?.[0]?.fileUrl,
  };
}

export function useMyReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiReport[] }>(API.REPORTS.LIST);
      setReports(data.data.map(mapReport));
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchReports();
  };

  return { reports, loading, refreshing, onRefresh };
}
