import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Mail, Phone, CalendarDays, BookOpen, UserSquare2 } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';

interface CustomerRow {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
  createdAt: string;
  _count: { bookings: number; patients: number };
}

export function Customers(): JSX.Element {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    api
      .get<{ success: true; data: CustomerRow[]; meta: PaginationMeta }>(
        `${API.ADMIN.CUSTOMERS}?${params.toString()}`,
      )
      .then(({ data }) => {
        if (cancelled) return;
        setCustomers(data.data);
        setMeta(data.meta);
      })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, search]);

  useEffect(() => { return load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const columns: ColumnDef<CustomerRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand-soft text-brand-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink-900">{row.fullName}</p>
            {row.email ? (
              <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                <Mail className="h-3 w-3" /> {row.email}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-ink-700">
          <Phone className="h-3.5 w-3.5 text-ink-400" /> {row.phone}
        </span>
      ),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm">
          <BookOpen className="h-3.5 w-3.5 text-ink-400" />
          <span className="font-semibold text-ink-900">{row._count.bookings}</span>
        </span>
      ),
    },
    {
      key: 'patients',
      header: 'Patients',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-sm">
          <UserSquare2 className="h-3.5 w-3.5 text-ink-400" />
          <span className="font-semibold text-ink-900">{row._count.patients}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          row.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <SidebarLayout
      title="Customers"
      description={meta ? `${meta.total} registered customers` : 'Registered customers'}
    >
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, phone or email…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
        >
          Search
        </button>
        {search ? (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="px-4 py-2 text-sm font-semibold text-ink-700 rounded-xl hover:bg-ink-100 transition-colors"
          >
            Clear
          </button>
        ) : null}
      </form>

      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {error}
        </div>
      ) : null}

      <Card padding="none" className="overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={customers}
          rowKey={(r) => r.id}
          onRowClick={(r) => navigate(`/admin/customers/${r.id}`)}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title={search ? 'No customers found' : 'No customers yet'}
              description={search ? 'Try a different search term.' : 'Customers will appear here once they register.'}
            />
          }
        />
        {meta ? <Pagination meta={meta} onPageChange={(p) => setPage(p)} /> : null}
      </Card>
    </SidebarLayout>
  );
}
