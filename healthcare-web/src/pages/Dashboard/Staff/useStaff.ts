import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { StaffProfile, VerifStatus } from '../../../types/staff.types';
import type { PaginationMeta } from '../../../types/api.types';

interface UseStaffReturn {
  staff: StaffProfile[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;

  // Filters
  filterStatus: VerifStatus | 'ALL';
  setFilterStatus: (s: VerifStatus | 'ALL') => void;
  filterAvailable: 'ALL' | 'true' | 'false';
  setFilterAvailable: (v: 'ALL' | 'true' | 'false') => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;

  page: number;
  setPage: (p: number) => void;

  // Actions
  verifyingId: string | null;
  handleVerify: (userId: string) => Promise<void>;
  openStaff: (userId: string) => void;
}

export function useStaff(): UseStaffReturn {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<VerifStatus | 'ALL'>('ALL');
  const [filterAvailable, setFilterAvailable] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (filterStatus !== 'ALL') params.set('verificationStatus', filterStatus);
        if (filterAvailable !== 'ALL') params.set('isAvailable', filterAvailable);
        const { data } = await api.get<{
          success: true;
          data: StaffProfile[];
          meta: PaginationMeta;
        }>(`${API.STAFF.LIST}?${params.toString()}`);
        if (cancelled) return;
        const filtered = searchQuery.trim()
          ? data.data.filter((s) =>
              s.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.user.phone.includes(searchQuery) ||
              s.staffCode.toLowerCase().includes(searchQuery.toLowerCase()),
            )
          : data.data;
        setStaff(filtered);
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
  }, [filterStatus, filterAvailable, searchQuery, page, reloadFlag]);

  const handleVerify = useCallback(async (userId: string): Promise<void> => {
    setVerifyingId(userId);
    try {
      await api.post(API.STAFF.VERIFY(userId));
      toast.success('Staff verified');
      setReloadFlag((f) => f + 1);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setVerifyingId(null);
    }
  }, []);

  return {
    staff,
    meta,
    isLoading,
    error,
    filterStatus,
    setFilterStatus: (s) => {
      setFilterStatus(s);
      setPage(1);
    },
    filterAvailable,
    setFilterAvailable: (v) => {
      setFilterAvailable(v);
      setPage(1);
    },
    searchQuery,
    setSearchQuery: (s) => {
      setSearchQuery(s);
      setPage(1);
    },
    page,
    setPage,
    verifyingId,
    handleVerify,
    openStaff: (userId) => navigate(`/admin/staff/${userId}`),
  };
}
