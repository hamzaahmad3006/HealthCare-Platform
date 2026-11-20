import { uploadSignedFile, type SignedUpload } from '../../../helper/signedUpload';
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

export interface VisitAddress {
  label?: string | null;
  line1?: string;
  line2?: string | null;
  area?: string;
  postalCode?: string | null;
  contactName?: string;
  contactPhone?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  city?: { name: string } | null;
}

export interface VisitRow extends BookingVisit {
  booking?: {
    bookingNumber: string;
    customerUserId: string;
    patientId: string;
    patient?: { fullName?: string };
    address?: VisitAddress;
    serviceType?: { code: string; name?: string } | null;
    reviews?: { rating: number; reviewText: string | null; createdAt: string }[];
  };
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
  reload: () => void;
  actionLoadingId: string | null;
  handleEnRoute: (visitId: string) => Promise<void>;
  handleCheckIn: (visitId: string, payload: CheckInPayload) => Promise<boolean>;
  handleCheckOut: (visitId: string, payload: CheckOutPayload) => Promise<boolean>;
  handleComplete: (visitId: string) => Promise<void>;
  handleUploadReport: (payload: UploadReportPayload) => Promise<boolean>;
  isUploadingReport: boolean;
}

const DEFAULT_COORDS = { lat: 31.4504, lng: 73.135 };

function requestBrowserPosition(highAccuracy: boolean, timeoutMs: number): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: highAccuracy ? 60_000 : 600_000,
      },
    );
  });
}

async function fetchIpLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number };
      if (data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { lat: data.latitude, lng: data.longitude };
      }
    }
  } catch {
    // try secondary IP geo endpoint
  }
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    if (res.ok) {
      const data = (await res.json()) as { latitude?: string; longitude?: string };
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  // 1. Try high-accuracy GPS
  const high = await requestBrowserPosition(true, 4500);
  if (high) return high;
  // 2. Fall back to Wi-Fi / network browser positioning
  const low = await requestBrowserPosition(false, 4500);
  if (low) return low;
  // 3. Fall back to IP geolocation (for desktop/Windows without hardware GPS)
  const ipCoords = await fetchIpLocation();
  if (ipCoords) return ipCoords;
  return null;
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
    const load = async (silent: boolean): Promise<void> => {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
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
        if (silent) setError(null);
      } catch (err) {
        if (!cancelled && !silent) setError(extractApiError(err).message);
      } finally {
        if (!cancelled && !silent) setIsLoading(false);
      }
    };
    void load(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    }, 6_000);

    const handleFocus = (): void => {
      if (document.visibilityState === 'visible') {
        void load(true);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [statusFilter, dateFilter, page, reloadFlag]);

  const reload = useCallback((): void => setReloadFlag((n) => n + 1), []);

  const handleEnRoute = useCallback(
    async (visitId: string): Promise<void> => {
      setActionLoadingId(visitId);
      try {
        const coords = await getCoords();
        await api.patch(
          API.VISITS.EN_ROUTE(visitId),
          coords ? { latitude: coords.lat, longitude: coords.lng } : {},
        );
        toast.success('Marked en route — live GPS tracking active for customer');
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
        let coords = await getCoords();
        if (!coords) {
          const targetVisit = visits.find((item) => item.id === visitId);
          const addrLat = Number(targetVisit?.booking?.address?.latitude);
          const addrLng = Number(targetVisit?.booking?.address?.longitude);
          if (Number.isFinite(addrLat) && Number.isFinite(addrLng) && addrLat !== 0 && addrLng !== 0) {
            coords = { lat: addrLat, lng: addrLng };
          } else {
            coords = DEFAULT_COORDS;
          }
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
    [reload, visits],
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
        const presignRes = await api.post<{ success: true; data: SignedUpload }>(API.REPORTS.PRESIGN(reportId), {
          mimeType: payload.file.type,
          fileSizeBytes: payload.file.size,
        });
        const { fileKey } = presignRes.data.data;
        const fileUrl = await uploadSignedFile(payload.file, presignRes.data.data);

        // 4 — confirm the upload
        await api.post(API.REPORTS.CONFIRM(reportId), {
          fileKey,
          fileUrl,
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
    reload,
    actionLoadingId,
    handleEnRoute,
    handleCheckIn,
    handleCheckOut,
    handleComplete,
    handleUploadReport,
    isUploadingReport,
  };
}
