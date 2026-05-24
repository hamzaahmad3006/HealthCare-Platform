import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { BookingVisit, VisitStatus } from '../../../types/booking.types';
import type { ReportType } from '../../../types/report.types';
import type { PaginationMeta } from '../../../types/api.types';

export interface UploadReportPayload {
  title: string;
  reportType: ReportType;
  file: File;
  bookingId: string;
  bookingVisitId: string;
  patientId: string;
}

interface VisitRow extends BookingVisit {
  booking?: { bookingNumber: string; customerUserId: string; patientId: string; serviceType?: { code: string } | null };
}

export interface CheckInPayload {
  beforeConditionText?: string;
}

export interface CheckOutPayload {
  visitNotes?: string;
  afterConditionText?: string;
}

interface UseVisitsReturn {
  visits: VisitRow[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  statusFilter: VisitStatus | 'ALL';
  setStatusFilter: (v: VisitStatus | 'ALL') => void;
  dateFilter: string;
  setDateFilter: (d: string) => void;
  page: number;
  setPage: (p: number) => void;
  actionLoadingId: string | null;
  handleEnRoute: (visitId: string) => Promise<void>;
  handleCheckIn: (visitId: string, payload: CheckInPayload) => Promise<boolean>;
  handleCheckOut: (visitId: string, payload: CheckOutPayload) => Promise<boolean>;
  handleComplete: (visitId: string) => Promise<void>;
  handleUploadReport: (payload: UploadReportPayload) => Promise<boolean>;
  isUploadingReport: boolean;
}

async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  });
}

export function useVisits(): UseVisitsReturn {
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VisitStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '50' });
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (dateFilter) {
          // Build the day's window in the user's LOCAL timezone, then send as
          // UTC ISO. Hard-coding `${dateFilter}T00:00:00Z` would slice the day
          // at UTC midnight (5 AM PKT) and miss early-morning visits while
          // accidentally including the next day's late-night ones.
          const start = new Date(`${dateFilter}T00:00:00`);
          const end = new Date(`${dateFilter}T23:59:59.999`);
          params.set('fromDate', start.toISOString());
          params.set('toDate', end.toISOString());
        }
        const { data } = await api.get<{
          success: true;
          data: VisitRow[];
          meta: PaginationMeta;
        }>(`${API.VISITS.LIST}?${params.toString()}`);
        if (cancelled) return;
        setVisits(data.data);
        setMeta(data.meta);
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, dateFilter, page, reloadFlag]);

  const reload = useCallback((): void => setReloadFlag((n) => n + 1), []);

  const handleEnRoute = useCallback(
    async (visitId: string): Promise<void> => {
      setActionLoadingId(visitId);
      try {
        await api.patch(API.VISITS.EN_ROUTE(visitId));
        toast.success('Marked en route — customer notified');
        reload();
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [reload],
  );

  const handleCheckIn = useCallback(
    async (visitId: string, payload: CheckInPayload): Promise<boolean> => {
      setActionLoadingId(visitId);
      try {
        const coords = await getCoords();
        if (!coords) {
          toast.error('Could not get your location. Enable GPS and try again.');
          return false;
        }
        await api.patch(API.VISITS.CHECK_IN(visitId), {
          checkInLatitude: coords.lat,
          checkInLongitude: coords.lng,
          ...(payload.beforeConditionText ? { beforeConditionText: payload.beforeConditionText } : {}),
        });
        toast.success('Checked in');
        reload();
        return true;
      } catch (err) {
        toast.error(extractApiError(err).message);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [reload],
  );

  const handleCheckOut = useCallback(
    async (visitId: string, payload: CheckOutPayload): Promise<boolean> => {
      setActionLoadingId(visitId);
      try {
        const coords = await getCoords();
        await api.patch(API.VISITS.CHECK_OUT(visitId), {
          ...(coords ? { checkOutLatitude: coords.lat, checkOutLongitude: coords.lng } : {}),
          ...(payload.visitNotes ? { visitNotes: payload.visitNotes } : {}),
          ...(payload.afterConditionText ? { afterConditionText: payload.afterConditionText } : {}),
        });
        toast.success('Checked out — tap Complete to finalize');
        reload();
        return true;
      } catch (err) {
        toast.error(extractApiError(err).message);
        return false;
      } finally {
        setActionLoadingId(null);
      }
    },
    [reload],
  );

  const handleComplete = useCallback(
    async (visitId: string): Promise<void> => {
      setActionLoadingId(visitId);
      try {
        await api.patch(API.VISITS.COMPLETE(visitId));
        toast.success('Visit completed');
        reload();
      } catch (err) {
        toast.error(extractApiError(err).message);
      } finally {
        setActionLoadingId(null);
      }
    },
    [reload],
  );

  const handleUploadReport = useCallback(
    async (payload: UploadReportPayload): Promise<boolean> => {
      setIsUploadingReport(true);
      try {
        // 1 — create the report record
        const createRes = await api.post<{ success: true; data: { id: string } }>(
          API.REPORTS.LIST,
          {
            bookingId: payload.bookingId,
            bookingVisitId: payload.bookingVisitId,
            patientId: payload.patientId,
            reportType: payload.reportType,
            title: payload.title,
            isVisibleToCustomer: true,
          },
        );
        const reportId = createRes.data.data.id;

        // 2 — get Cloudinary presigned URL
        const presignRes = await api.post<{
          success: true;
          data: {
            uploadUrl: string;
            fileKey: string;
            uploadParams: {
              api_key: string;
              timestamp: number;
              signature: string;
              public_id: string;
              resource_type: string;
            };
          };
        }>(API.REPORTS.PRESIGN(reportId), {
          mimeType: payload.file.type,
          fileSizeBytes: payload.file.size,
        });
        const { uploadUrl, fileKey, uploadParams } = presignRes.data.data;

        // 3 — upload directly to Cloudinary (multipart, same as staff docs)
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('api_key', uploadParams.api_key);
        formData.append('timestamp', String(uploadParams.timestamp));
        formData.append('signature', uploadParams.signature);
        formData.append('public_id', uploadParams.public_id);
        const uploadResp = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!uploadResp.ok) throw new Error('File upload to storage failed');
        const uploaded = (await uploadResp.json()) as { secure_url: string };

        // 4 — confirm the upload
        await api.post(API.REPORTS.CONFIRM(reportId), {
          fileKey,
          fileUrl: uploaded.secure_url,
          mimeType: payload.file.type,
          fileSizeBytes: payload.file.size,
        });

        toast.success('Report uploaded — customer can now view it.');
        return true;
      } catch (err) {
        toast.error(extractApiError(err).message);
        return false;
      } finally {
        setIsUploadingReport(false);
      }
    },
    [],
  );

  return {
    visits,
    meta,
    isLoading,
    error,
    statusFilter,
    setStatusFilter: (v) => {
      setStatusFilter(v);
      setPage(1);
    },
    dateFilter,
    setDateFilter: (d) => {
      setDateFilter(d);
      setPage(1);
    },
    page,
    setPage,
    actionLoadingId,
    handleEnRoute,
    handleCheckIn,
    handleCheckOut,
    handleComplete,
    handleUploadReport,
    isUploadingReport,
  };
}
