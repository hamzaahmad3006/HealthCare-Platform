import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api, extractApiError } from '../../../api/client';
import { API } from '../../../api/endpoints';
import type { StaffReport, ApiStaffReport } from '../../../types/StaffReports.types';

function mapReport(r: ApiStaffReport): StaffReport {
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

export function useStaffReports() {
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Backend auto-scopes STAFF to reports they personally uploaded
  // (uploadedByUserId === self) — no query params needed.
  const fetchReports = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<{ success: true; data: ApiStaffReport[] }>(API.REPORTS.LIST);
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
