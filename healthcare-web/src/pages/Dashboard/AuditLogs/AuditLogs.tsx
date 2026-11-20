import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Search,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Terminal,
  UserCheck,
  Filter,
  Calendar,
  ExternalLink,
  Smartphone,
  Monitor,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { DataTable, type ColumnDef } from '../../../component/admin/DataTable';
import { EmptyState } from '../../../component/common/EmptyState';
import { Pagination } from '../../../component/common/Pagination';
import { Card } from '../../../constant/Card';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import type { PaginationMeta } from '../../../types/api.types';

interface AuditPayload {
  valuesOmitted?: boolean;
  fieldCount?: number;
  actionCode?: string;
  operation?: string;
  category?: 'CLINICAL' | 'BOOKING' | 'SECURITY' | 'STAFF' | 'PATIENT' | 'SYSTEM';
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  endpoint?: string;
  changedFields?: string[];
  statusCode?: number;
  hipaaRedacted?: boolean;
  deviceTag?: string;
  locationTag?: string;
  [key: string]: unknown;
}

interface AuditLog {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  payload: AuditPayload | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { fullName: string; role: string } | null;
}

interface SecurityAlertItem {
  id: string;
  title: string;
  message: string;
  ipAddress: string;
  attemptCount: number;
  lastSeenAt: string;
  severity: 'CRITICAL' | 'WARNING';
}

interface AuditSummary {
  totalEvents: number;
  todayEvents: number;
  clinicalBookingEvents: number;
  securityEvents: number;
  securityAlerts?: SecurityAlertItem[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
  STAFF: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  CUSTOMER: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  SYSTEM: 'bg-ink-100 text-ink-600 ring-1 ring-ink-400/20',
};

function actionBadgeStyle(action: string, severity?: string): string {
  if (
    severity === 'CRITICAL' ||
    action === 'DELETE' ||
    action === 'LOGIN_FAILED' ||
    action === 'ACCOUNT_LOCKED' ||
    action === 'SUSPICIOUS_ACTIVITY'
  ) {
    return 'bg-danger-50 text-danger-700 ring-1 ring-danger-600/20';
  }
  if (severity === 'WARNING' || action.includes('CANCEL') || action.includes('MISS')) {
    return 'bg-warning-50 text-warning-700 ring-1 ring-warning-600/20';
  }
  if (action === 'POST' || action.includes('CREATE') || action.includes('CONFIRM')) {
    return 'bg-success-50 text-success-700 ring-1 ring-success-600/20';
  }
  if (action === 'PATCH' || action === 'PUT') {
    return 'bg-brand-50 text-brand-700 ring-1 ring-brand-600/20';
  }
  return 'bg-ink-100 text-ink-700';
}

function categoryBadgeStyle(category?: string): string {
  switch (category) {
    case 'CLINICAL':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'BOOKING':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PATIENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'STAFF':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'SECURITY':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-ink-50 text-ink-600 border-ink-200';
  }
}

function resolveEntityDeepLink(row: AuditLog): { to: string; label: string } | null {
  const hasUuid = Boolean(row.entityId && UUID_REGEX.test(row.entityId));
  switch (row.entityType) {
    case 'BOOKING':
      return hasUuid
        ? { to: `/admin/bookings/${row.entityId}`, label: 'View Booking' }
        : { to: '/admin/bookings', label: 'Bookings Desk' };
    case 'STAFF':
      return hasUuid
        ? { to: `/admin/staff/${row.entityId}`, label: 'View Staff Profile' }
        : { to: '/admin/staff', label: 'Staff Directory' };
    case 'VISIT':
      return { to: '/admin/visits', label: 'Visits Command' };
    case 'REPORT':
      return { to: '/admin/reports', label: 'Clinical Reports' };
    case 'REVIEW':
      return { to: '/admin/reviews', label: 'Reviews Desk' };
    case 'PAYMENT':
      return { to: '/admin/payments', label: 'Payments Ledger' };
    case 'PATIENT':
    case 'ADDRESS':
      if (row.actorUserId && row.actor?.role === 'CUSTOMER') {
        return { to: `/admin/customers/${row.actorUserId}`, label: 'View Customer' };
      }
      return { to: '/admin/customers', label: 'Customers List' };
    case 'USER':
      if (hasUuid && row.actor?.role === 'STAFF') {
        return { to: `/admin/staff/${row.entityId}`, label: 'View Staff' };
      }
      if (hasUuid && row.actor?.role === 'CUSTOMER') {
        return { to: `/admin/customers/${row.entityId}`, label: 'View Customer' };
      }
      if (row.actorUserId && row.actor?.role === 'CUSTOMER') {
        return { to: `/admin/customers/${row.actorUserId}`, label: 'View Customer' };
      }
      if (row.actorUserId && row.actor?.role === 'STAFF') {
        return { to: `/admin/staff/${row.actorUserId}`, label: 'View Staff' };
      }
      return null;
    default:
      if (row.actorUserId && row.actor?.role === 'STAFF') {
        return { to: `/admin/staff/${row.actorUserId}`, label: 'View Staff' };
      }
      if (row.actorUserId && row.actor?.role === 'CUSTOMER') {
        return { to: `/admin/customers/${row.actorUserId}`, label: 'View Customer' };
      }
      return null;
  }
}

function resolveActorDeepLink(row: AuditLog): string | null {
  if (!row.actorUserId || !row.actor) return null;
  if (row.actor.role === 'STAFF') return `/admin/staff/${row.actorUserId}`;
  if (row.actor.role === 'CUSTOMER') return `/admin/customers/${row.actorUserId}`;
  return null;
}

function PayloadCell({ row }: { row: AuditLog }): JSX.Element {
  const [open, setOpen] = useState(false);
  const payload = row.payload;
  if (!payload) return <span className="text-ink-300 text-xs">—</span>;

  const fieldCount = typeof payload.fieldCount === 'number' ? payload.fieldCount : 0;
  const changedFields = Array.isArray(payload.changedFields) ? payload.changedFields : [];
  const endpoint =
    typeof payload.endpoint === 'string'
      ? payload.endpoint
      : `${row.action} /${row.entityType.toLowerCase()}`;
  const statusCode = typeof payload.statusCode === 'number' ? payload.statusCode : 200;

  return (
    <div className="max-w-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50/70 hover:bg-brand-100/80 px-2.5 py-1 rounded-lg transition-colors"
      >
        <Lock className="h-3 w-3 text-brand-600" />
        <span>Safe Summary ({fieldCount} fields)</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="mt-2 rounded-xl border border-ink-200 bg-ink-50/90 p-3 text-xs space-y-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-ink-200/70 pb-1.5">
            <span className="inline-flex items-center gap-1 font-mono text-2xs text-ink-700 font-semibold">
              <Terminal className="h-3 w-3 text-ink-400" />
              {endpoint}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                statusCode >= 400
                  ? 'bg-danger-100 text-danger-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              HTTP {statusCode}
            </span>
          </div>

          {changedFields.length > 0 ? (
            <div>
              <p className="text-2xs font-semibold text-ink-500 uppercase tracking-wider mb-1">
                Touched Schema Fields
              </p>
              <div className="flex flex-wrap gap-1">
                {changedFields.map((field) => (
                  <span
                    key={field}
                    className="px-1.5 py-0.5 rounded bg-white border border-ink-200 font-mono text-2xs text-ink-700"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-2xs text-ink-500">
              Payload Fields Count: <strong className="text-ink-700">{fieldCount}</strong>
            </p>
          )}

          <div className="flex items-center gap-1.5 pt-1 border-t border-ink-200/70 text-2xs text-emerald-700 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>HIPAA Safe: PHI &amp; clinical values omitted</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const ENTITY_TYPES = [
  { value: 'BOOKING', label: 'Bookings' },
  { value: 'VISIT', label: 'Clinical Visits' },
  { value: 'PATIENT', label: 'Patients (PHI)' },
  { value: 'STAFF', label: 'Staff & Doctors' },
  { value: 'REPORT', label: 'Medical Reports' },
  { value: 'REVIEW', label: 'Customer Reviews' },
  { value: 'USER', label: 'User Accounts' },
  { value: 'DEVICE_TOKEN', label: 'Push Devices' },
  { value: 'SECURITY', label: 'Security & Auth Watch' },
];

const ROLE_FILTERS = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Clinical Staff' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SYSTEM', label: 'System / Auth' },
];

const ACTION_FILTERS = [
  { value: '', label: 'All Methods' },
  { value: 'POST', label: 'POST (Create / Trigger)' },
  { value: 'PATCH', label: 'PATCH (Update / Transition)' },
  { value: 'DELETE', label: 'DELETE (Removal)' },
  { value: 'SECURITY', label: 'Security & Alerts' },
];

function toDateInputString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AuditLogs(): JSX.Element {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [summary, setSummary] = useState<AuditSummary>({
    totalEvents: 0,
    todayEvents: 0,
    clinicalBookingEvents: 0,
    securityEvents: 0,
    securityAlerts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [entityType, setEntityType] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7d' | 'month' | 'custom'>('all');
  const [page, setPage] = useState(1);

  const applyDatePreset = (preset: 'all' | 'today' | '7d' | 'month') => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();
    const todayStr = toDateInputString(now);

    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setFromDate(toDateInputString(d));
      setToDate(todayStr);
    } else if (preset === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(toDateInputString(d));
      setToDate(todayStr);
    }
  };

  const load = useCallback(
    (silent = false) => {
      let cancelled = false;
      if (!silent) setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (entityType) params.set('entityType', entityType);
      if (roleFilter) params.set('role', roleFilter);
      if (actionFilter) params.set('action', actionFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);

      api
        .get<{
          success: true;
          data: AuditLog[];
          meta: PaginationMeta;
          summary?: AuditSummary;
        }>(`${API.ADMIN.AUDIT_LOGS}?${params}`)
        .then(({ data }) => {
          if (cancelled) return;
          setLogs(data.data);
          setMeta(data.meta);
          if (data.summary) {
            setSummary(data.summary);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(extractApiError(err).message);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    },
    [page, entityType, roleFilter, actionFilter, searchQuery, fromDate, toDate],
  );

  useEffect(() => {
    return load(false);
  }, [load]);

  // Background poll every 12s for real-time suspicious activity alerts
  useEffect(() => {
    const timer = window.setInterval(() => {
      load(true);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [load]);

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = [
      'Timestamp',
      'Actor Name',
      'Actor Role',
      'Operation',
      'Action Code',
      'HTTP Method',
      'Category',
      'Severity',
      'Entity Type',
      'Entity ID',
      'Endpoint',
      'Touched Fields',
      'HTTP Status',
      'IP Address',
      'Device Platform',
      'Location Tag',
      'HIPAA Redacted',
    ];

    const escapeCsv = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = logs.map((row) => {
      const p = row.payload ?? {};
      const changed = Array.isArray(p.changedFields) ? p.changedFields.join('; ') : '';
      return [
        new Date(row.createdAt).toISOString(),
        row.actor?.fullName ?? 'System',
        row.actor?.role ?? 'SYSTEM',
        p.operation ?? `${row.action} ${row.entityType}`,
        p.actionCode ?? row.action,
        row.action,
        p.category ?? 'SYSTEM',
        p.severity ?? 'INFO',
        row.entityType,
        row.entityId,
        p.endpoint ?? '',
        changed,
        p.statusCode ?? 200,
        row.ipAddress ?? '',
        p.deviceTag ?? 'Web / API Client',
        p.locationTag ?? 'Faisalabad HQ',
        'YES (Values Omitted)',
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `homehealth-hipaa-audit-logs-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Boolean(
    entityType || roleFilter || actionFilter || searchQuery || fromDate || toDate,
  );

  const activeAlerts = summary.securityAlerts ?? [];

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'time',
      header: 'Timestamp',
      render: (row) => (
        <div className="whitespace-nowrap">
          <p className="text-xs font-semibold text-ink-800">{formatDateTime(row.createdAt)}</p>
          <p className="text-2xs text-ink-400 font-mono">ID: {row.id.slice(0, 8)}</p>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor & Role',
      render: (row) => {
        const role = row.actor?.role ?? 'SYSTEM';
        const actorLink = resolveActorDeepLink(row);
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
              {(row.actor?.fullName ?? 'SY').slice(0, 2).toUpperCase()}
            </div>
            <div>
              {actorLink ? (
                <Link
                  to={actorLink}
                  className="text-sm font-semibold text-ink-900 hover:text-brand-600 inline-flex items-center gap-1 transition-colors"
                >
                  <span>{row.actor?.fullName}</span>
                  <ExternalLink className="h-3 w-3 text-ink-400" />
                </Link>
              ) : (
                <p className="text-sm font-semibold text-ink-900">
                  {row.actor?.fullName ?? 'Automated System'}
                </p>
              )}
              <div>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-2xs font-bold ${
                    ROLE_BADGE[role] ?? ROLE_BADGE['SYSTEM']
                  }`}
                >
                  {role}
                </span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'operation',
      header: 'Operation & Security Event',
      render: (row) => {
        const p = row.payload ?? {};
        const operation =
          typeof p.operation === 'string' ? p.operation : `${row.action} ${row.entityType}`;
        const actionCode = typeof p.actionCode === 'string' ? p.actionCode : row.action;
        const severity = typeof p.severity === 'string' ? p.severity : 'INFO';

        return (
          <div className="max-w-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md text-2xs font-bold tracking-wide ${actionBadgeStyle(
                  row.action,
                  severity,
                )}`}
              >
                {actionCode}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-ink-100 text-ink-600 font-mono text-2xs font-semibold">
                {row.action}
              </span>
              {severity === 'CRITICAL' ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-danger-100 text-danger-800 text-2xs font-bold animate-pulse">
                  <ShieldAlert className="h-3 w-3" /> Red Alert
                </span>
              ) : null}
            </div>
            <p className="text-xs font-medium text-ink-800 mt-1">{operation}</p>
          </div>
        );
      },
    },
    {
      key: 'entity',
      header: 'Target & Direct Link',
      render: (row) => {
        const category =
          typeof row.payload?.category === 'string' ? row.payload.category : 'SYSTEM';
        const isKnownUuid = row.entityId && row.entityId !== 'unknown';
        const deepLink = resolveEntityDeepLink(row);

        return (
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded border text-2xs font-bold ${categoryBadgeStyle(
                  category,
                )}`}
              >
                {row.entityType}
              </span>
              {isKnownUuid ? (
                <span className="text-2xs text-ink-400 font-mono">
                  #{row.entityId.slice(0, 8)}
                </span>
              ) : null}
            </div>

            {deepLink ? (
              <Link
                to={deepLink.to}
                className="inline-flex items-center gap-1 mt-1.5 text-2xs font-semibold text-brand-600 hover:text-brand-800 bg-brand-50/60 hover:bg-brand-100/70 px-2 py-0.5 rounded-md transition-colors"
              >
                <span>{deepLink.label}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            ) : (
              <p className="text-2xs text-ink-400 font-mono mt-1 truncate max-w-[140px]">
                {row.payload?.endpoint ?? 'System Endpoint'}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'ip',
      header: 'Device, Location & IP',
      render: (row) => {
        const ip = row.ipAddress ?? '—';
        const deviceTag =
          typeof row.payload?.deviceTag === 'string'
            ? row.payload.deviceTag
            : 'Web / API Client';
        const locationTag =
          typeof row.payload?.locationTag === 'string'
            ? row.payload.locationTag
            : 'Faisalabad HQ';
        const isMobile =
          deviceTag.toLowerCase().includes('android') ||
          deviceTag.toLowerCase().includes('ios') ||
          deviceTag.toLowerCase().includes('iphone') ||
          deviceTag.toLowerCase().includes('mobile');

        return (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-ink-100 text-ink-800 text-2xs font-semibold">
              {isMobile ? (
                <Smartphone className="h-3 w-3 text-brand-600 shrink-0" />
              ) : (
                <Monitor className="h-3 w-3 text-blue-600 shrink-0" />
              )}
              <span>{deviceTag}</span>
            </div>

            <div className="flex items-center gap-1 text-2xs text-ink-500">
              <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
              <span>{locationTag}</span>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-ink-600">{ip}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'payload',
      header: 'HIPAA Safe Payload',
      render: (row) => <PayloadCell row={row} />,
    },
  ];

  return (
    <SidebarLayout
      title="Security & HIPAA Audit Ledger"
      description={
        meta
          ? `Monitoring ${meta.total.toLocaleString()} immutable clinical & platform events`
          : 'Real-time security & compliance activity ledger'
      }
    >
      {/* Real-Time Suspicious Activity Red Security Alert Banner */}
      {activeAlerts.length > 0 ? (
        <div className="mb-6 space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-2xl border-2 border-danger-500 bg-danger-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-danger-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-extrabold text-danger-900">{alert.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-danger-600 text-white">
                      {alert.attemptCount} Failed Attempts
                    </span>
                  </div>
                  <p className="text-xs text-danger-800 mt-1">{alert.message}</p>
                  <p className="text-2xs text-danger-600 mt-0.5">
                    Last detected: {formatDateTime(alert.lastSeenAt)} · Real-time push notification dispatched to Super Admins
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchInput(alert.ipAddress);
                  setSearchQuery(alert.ipAddress);
                  setActionFilter('SECURITY');
                  setPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold shrink-0 transition-colors"
              >
                Investigate IP ({alert.ipAddress})
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Total Audit Events
              </p>
              <p className="text-2xl font-extrabold text-ink-900 mt-1">
                {summary.totalEvents.toLocaleString()}
              </p>
              <p className="text-2xs text-ink-500 mt-0.5">Immutable compliance ledger</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Today&apos;s Activity
              </p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                {summary.todayEvents.toLocaleString()}
              </p>
              <p className="text-2xs text-ink-500 mt-0.5">Events recorded today</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Clinical &amp; Care Ops
              </p>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">
                {summary.clinicalBookingEvents.toLocaleString()}
              </p>
              <p className="text-2xs text-ink-500 mt-0.5">Bookings, visits, patients &amp; reports</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card
          className={`p-4 border-l-4 ${
            activeAlerts.length > 0 ? 'border-l-danger-600 bg-danger-50/40' : 'border-l-amber-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                Security &amp; Auth Watch
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-extrabold text-amber-700">
                  {summary.securityEvents.toLocaleString()}
                </p>
                {activeAlerts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-danger-600 text-white animate-pulse">
                    {activeAlerts.length} Alert
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700">
                    0 Threats
                  </span>
                )}
              </div>
              <p className="text-2xs text-ink-500 mt-0.5">5-min brute-force &amp; auth monitor</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* HIPAA Compliance Banner & Action Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 mb-4 border-b border-ink-100">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-ink-900">
                  HIPAA Privacy Shield &amp; Live Anomaly Monitor (SRS §11.6)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                  PHI Values Redacted
                </span>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 ring-1 ring-blue-600/20">
                  Live Auto-Refresh (12s)
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5">
                Tracks actor identity, device platform, location tag, and target entity links while omitting sensitive patient clinical values.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => load(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-xs font-semibold text-ink-700 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV Report
            </button>
          </div>
        </div>

        {/* Date Range Preset Pills & Custom From -> To Pickers */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-ink-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 mr-1">
              <Calendar className="h-3.5 w-3.5 text-brand-600" />
              Date Range:
            </span>
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: 'month', label: 'This Month' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  datePreset === p.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-ink-500">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="text-xs rounded-xl border border-ink-200 px-2.5 py-1.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
              />
            </div>
            <span className="text-ink-400 text-xs">→</span>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-ink-500">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDatePreset('custom');
                  setPage(1);
                }}
                className="text-xs rounded-xl border border-ink-200 px-2.5 py-1.5 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <form
            className="lg:col-span-4 relative"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(searchInput);
              setPage(1);
            }}
          >
            <Search className="h-4 w-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actor name, IP, entity or ID…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (!e.target.value.trim()) {
                  setSearchQuery('');
                  setPage(1);
                }
              }}
              className="w-full text-sm rounded-xl border border-ink-200 pl-9 pr-16 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-ink-100 hover:bg-ink-200 text-xs font-semibold text-ink-700 transition-colors"
            >
              Find
            </button>
          </form>

          {/* Entity Type Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-400 shrink-0 hidden sm:block" />
            <select
              className="w-full text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Resource Types</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actor Role Filter */}
          <div className="lg:col-span-2">
            <select
              className="w-full text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action / Method Filter */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <select
              className="w-full text-sm rounded-xl border border-ink-200 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              {ACTION_FILTERS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>

            {hasActiveFilters ? (
              <button
                type="button"
                className="text-xs font-semibold text-danger-600 hover:text-danger-800 px-2.5 py-2 rounded-xl hover:bg-danger-50 transition-colors shrink-0"
                onClick={() => {
                  setEntityType('');
                  setRoleFilter('');
                  setActionFilter('');
                  setSearchInput('');
                  setSearchQuery('');
                  setFromDate('');
                  setToDate('');
                  setDatePreset('all');
                  setPage(1);
                }}
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {error}
        </div>
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
              title="No matching audit events"
              description={
                hasActiveFilters
                  ? 'Try adjusting your date range, search query, role, or resource filters.'
                  : 'Audit logs will appear here as platform actions occur.'
              }
            />
          }
        />
        {meta ? <Pagination meta={meta} onPageChange={(p) => setPage(p)} /> : null}
      </Card>
    </SidebarLayout>
  );
}
