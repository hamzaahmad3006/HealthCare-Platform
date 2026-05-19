import { Search, BadgeCheck, Filter } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Badge } from '../../../constant/Badge';
import { Button } from '../../../constant/Button';
import { Card } from '../../../constant/Card';
import { Input } from '../../../constant/Input';
import { useStaff } from './useStaff';
import type { StaffProfile, VerifStatus } from '../../../types/staff.types';

const STATUS_OPTIONS: { id: VerifStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'VERIFIED', label: 'Verified' },
  { id: 'REJECTED', label: 'Rejected' },
];

const AVAIL_OPTIONS: { id: 'ALL' | 'true' | 'false'; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'true', label: 'Available' },
  { id: 'false', label: 'Unavailable' },
];

export function Staff(): JSX.Element {
  const s = useStaff();

  const columns: ColumnDef<StaffProfile>[] = [
    {
      key: 'name',
      header: 'Staff',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-semibold">
            {row.user.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink-900">{row.user.fullName}</p>
            <p className="text-2xs font-mono text-ink-500 mt-0.5">{row.staffCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-ink-700">{row.user.phone}</span>,
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (row) => <span className="text-ink-700">{row.experienceYears} yrs</span>,
    },
    {
      key: 'verif',
      header: 'Verification',
      render: (row) => <StatusBadge status={row.verificationStatus} kind="verif" />,
    },
    {
      key: 'avail',
      header: 'Availability',
      render: (row) => (
        <Badge tone={row.isAvailable ? 'success' : 'neutral'} dot>
          {row.isAvailable ? 'Available' : 'Unavailable'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.verificationStatus === 'PENDING' ? (
            <Button
              size="sm"
              onClick={() => void s.handleVerify(row.userId)}
              isLoading={s.verifyingId === row.userId}
              leftIcon={<BadgeCheck className="h-3.5 w-3.5" />}
            >
              Verify
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <SidebarLayout title="Staff" description="Verify, manage, and onboard healthcare professionals">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[16rem]">
          <Input
            placeholder="Search by name, phone, or staff code…"
            leftIcon={<Search className="h-4 w-4" />}
            value={s.searchQuery}
            onChange={(e) => s.setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            <Filter className="h-3 w-3 inline mr-1" />
            Verification
          </label>
          <div className="bg-white rounded-xl ring-1 ring-ink-200 p-1 inline-flex gap-1">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => s.setFilterStatus(o.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  s.filterStatus === o.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-2xs font-semibold uppercase tracking-wider text-ink-500 block mb-1">
            Availability
          </label>
          <div className="bg-white rounded-xl ring-1 ring-ink-200 p-1 inline-flex gap-1">
            {AVAIL_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => s.setFilterAvailable(o.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  s.filterAvailable === o.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {s.error ? (
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {s.error}
        </div>
      ) : null}

      <Card padding="none" className="mt-6 overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={s.staff}
          rowKey={(row) => row.userId}
          onRowClick={(row) => s.openStaff(row.userId)}
          isLoading={s.isLoading}
          emptyState={
            <EmptyState
              title="No staff found"
              description="Adjust filters or onboard new staff to get started."
            />
          }
        />
        {s.meta ? <Pagination meta={s.meta} onPageChange={s.setPage} /> : null}
      </Card>
    </SidebarLayout>
  );
}
