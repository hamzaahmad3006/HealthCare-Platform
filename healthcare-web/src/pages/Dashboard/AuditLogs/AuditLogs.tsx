import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Search, ChevronDown } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { fullName: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:  'bg-success-50 text-success-700',
  UPDATE:  'bg-brand-50 text-brand-700',
  DELETE:  'bg-danger-50 text-danger-700',
  CONFIRM: 'bg-success-50 text-success-700',
  CANCEL:  'bg-danger-50 text-danger-700',
  VERIFY:  'bg-warning-50 text-warning-700',
};

function actionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.includes(key)) return ACTION_COLORS[key]!;
  }
  return 'bg-ink-100 text-ink-600';
}

function PayloadCell({ payload }: { payload: Record<string, unknown> | null }): JSX.Element {
  const [open, setOpen] = useState(false);
  if (!payload) return <span className="text-ink-300 text-xs">—</span>;
  return (
    <div className="max-w-xs">
      <button onClick={() => setOpen((p) => !p)} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors">
        View <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <pre className="mt-1 text-2xs text-ink-600 bg-ink-50 rounded-lg p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

const ENTITY_TYPES = ['BOOKING', 'VISIT', 'STAFF', 'PAYMENT', 'USER', 'REPORT'];

export function AuditLogs(): JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30' });
    if (entityType) params.set('entityType', entityType);
    api
      .get<{ success: true; data: AuditLog[]; meta: PaginationMeta }>(`${API.ADMIN.AUDIT_LOGS}?${params}`)
      .then(({ data }) => {
        if (cancelled) return;
        setLogs(data.data);
        setMeta(data.meta);
      })
      .catch((err) => { if (!cancelled) setError(extractApiError(err).message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, entityType]);

  useEffect(() => { return load(); }, [load]);

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'time',
      header: 'Time',
      render: (row) => <span className="text-xs text-ink-500 whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => row.actor ? (
        <div>
          <p className="text-sm font-semibold text-ink-900">{row.actor.fullName}</p>
          <p className="text-2xs text-ink-400">{row.actor.role}</p>
        </div>
      ) : <span className="text-xs text-ink-400">System</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${actionColor(row.action)}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-ink-700">{row.entityType}</p>
          <p className="text-2xs text-ink-400 font-mono truncate max-w-[100px]">{row.entityId.slice(0, 8)}…</p>
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => <span className="text-xs text-ink-400 font-mono">{row.ipAddress ?? '—'}</span>,
    },
    {
      key: 'payload',
      header: 'Payload',
      render: (row) => <PayloadCell payload={row.payload} />,
    },
  ];

  return (
    <SidebarLayout title="Audit Logs" description={meta ? `${meta.total} log entries` : 'System activity log'}>
      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-ink-400" />
          <select
            className="text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {entityType ? (
          <button
            className="text-sm text-ink-500 hover:text-ink-900 px-3 py-2 rounded-xl hover:bg-ink-100 transition-colors"
            onClick={() => { setEntityType(''); setPage(1); }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">{error}</div>
      ) : null}

      <Card padding="none" className="overflow-hidden animate-slide-up">
        <DataTable
          columns={columns}
          data={logs}
          rowKey={(r) => r.id}
          isLoading={isLoading}
          emptyState={
            <EmptyState
              icon={<ClipboardList className="h-7 w-7" />}
              title="No logs found"
              description={entityType ? 'No logs for this entity type.' : 'Audit logs will appear here as actions occur.'}
            />
          }
        />
        {meta ? <Pagination meta={meta} onPageChange={(p) => setPage(p)} /> : null}
      </Card>
    </SidebarLayout>
  );
}
