import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  MapPin,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Clock,
  Star,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppSelector } from '../../redux/store';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import { formatDateTime } from '../../helper/format';
import { buildNotificationLink } from '../../helper/notificationLink';

type TemplateCode =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'STAFF_ASSIGNED'
  | 'STAFF_EN_ROUTE'
  | 'STAFF_CHECKED_IN'
  | 'VISIT_COMPLETED'
  | 'FEEDBACK_REMINDER'
  | 'VISIT_REMINDER'
  | 'REPORT_AVAILABLE'
  | 'STAFF_VERIFIED'
  | 'STAFF_REVIEW_PENDING'
  | 'DOCTOR_BOOKING_REQUEST'
  | 'DOCTOR_ACCEPTED'
  | 'DOCTOR_TIME_ACCEPTED';

interface NotifItem {
  id: string;
  templateCode: string;
  renderedContent: string;
  bookingId: string | null;
  staffUserId?: string | null;
  createdAt: string;
  sentAt: string | null;
  userId?: string | null;
}

const TEMPLATE_META: Record<
  TemplateCode,
  { label: string; adminLabel?: string; Icon: React.ElementType; color: string }
> = {
  BOOKING_RECEIVED:       { label: 'Booking received',        adminLabel: '🚨 New booking — assign staff',     Icon: CalendarClock, color: 'text-brand-600'   },
  BOOKING_CONFIRMED:      { label: 'Booking confirmed',       Icon: CalendarCheck, color: 'text-success-600' },
  BOOKING_CANCELLED:      { label: 'Booking cancelled',       adminLabel: '⚠️ Booking cancelled',              Icon: CalendarClock, color: 'text-danger-600'  },
  STAFF_ASSIGNED:         { label: 'New visit assigned',      Icon: ClipboardList, color: 'text-brand-600'   },
  STAFF_EN_ROUTE:         { label: 'Staff on the way',        Icon: MapPin,        color: 'text-accent-600'  },
  STAFF_CHECKED_IN:       { label: '🏥 Staff checked in',     Icon: CheckCircle2,  color: 'text-emerald-600' },
  VISIT_COMPLETED:        { label: 'Visit completed',         adminLabel: '✅ Visit completed by staff',       Icon: CheckCircle2,  color: 'text-success-600' },
  FEEDBACK_REMINDER:      { label: '⭐ Rate your staff visit', Icon: Star,          color: 'text-amber-500'   },
  VISIT_REMINDER:         { label: 'Upcoming visit reminder', Icon: Clock,         color: 'text-amber-600'   },
  REPORT_AVAILABLE:       { label: 'New report available',    adminLabel: '📄 Clinical report uploaded',       Icon: FileText,      color: 'text-info-600'    },
  STAFF_VERIFIED:         { label: '🎉 Account verified!',    Icon: Sparkles,      color: 'text-emerald-600' },
  STAFF_REVIEW_PENDING:   { label: '📋 Staff verification pending', adminLabel: '📋 Staff verification pending', Icon: UserCheck, color: 'text-amber-600' },
  DOCTOR_BOOKING_REQUEST: { label: 'New doctor request',      Icon: UserCheck,     color: 'text-brand-600'   },
  DOCTOR_ACCEPTED:        { label: 'Doctor accepted',         adminLabel: '👨‍⚕️ Doctor accepted — confirm now', Icon: UserCheck,     color: 'text-emerald-600' },
  DOCTOR_TIME_ACCEPTED:   { label: 'Proposed time accepted',  adminLabel: '📅 Time accepted — confirm now',    Icon: CalendarCheck, color: 'text-success-600' },
};

const POLL_INTERVAL_MS = 6_000;

// Module-level cache keyed by userId so navigating between pages (which
// remounts SidebarLayout -> NotificationBell) preserves the badge on frame 0
// without any flicker or disappear.
const notifsCache = new Map<string, NotifItem[]>();

function getLastReadKey(userId?: string): string {
  return userId ? `notif_last_read_${userId}` : 'notif_last_read';
}

function getLastRead(userId?: string): number {
  const scoped = localStorage.getItem(getLastReadKey(userId));
  if (scoped !== null) return parseInt(scoped, 10) || 0;
  return 0;
}

function saveLastRead(userId?: string, timestamp = Date.now()): number {
  localStorage.setItem(getLastReadKey(userId), String(timestamp));
  return timestamp;
}

export function NotificationBell(): JSX.Element {
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id;
  const role = user?.role;

  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>(() =>
    userId ? (notifsCache.get(userId) ?? []) : [],
  );
  const [loading, setLoading] = useState(false);
  const [lastRead, setLastRead] = useState<number>(() => getLastRead(userId));
  const ref = useRef<HTMLDivElement>(null);

  // Sync userId changes (e.g. login / user switch)
  useEffect(() => {
    setLastRead(getLastRead(userId));
    setNotifs(userId ? (notifsCache.get(userId) ?? []) : []);
  }, [userId]);

  const fetchNotifications = useCallback(
    async (showSpinner = false): Promise<void> => {
      if (!userId) return;
      if (showSpinner) setLoading(true);
      try {
        const { data } = await api.get<{ success: true; data: NotifItem[] }>(
          `${API.NOTIFICATIONS.LIST}?scope=personal`,
        );
        const raw = Array.isArray(data.data) ? data.data : [];
        const adminAllowedCodes = new Set([
          'STAFF_REVIEW_PENDING',
          'BOOKING_RECEIVED',
          'BOOKING_CANCELLED',
          'DOCTOR_ACCEPTED',
          'DOCTOR_TIME_ACCEPTED',
          'VISIT_COMPLETED',
          'REPORT_AVAILABLE',
        ]);
        const list = raw.filter((item) => {
          if (role === 'ADMIN') {
            return adminAllowedCodes.has(item.templateCode);
          }
          return true;
        });
        notifsCache.set(userId, list);
        setNotifs(list);
      } catch {
        // Silent background error — retry on next poll/focus.
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [userId, role],
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch immediately on mount + poll every 6s + refetch on window focus or
  // real-time push event so the badge appears right away without needing to
  // open the bell dropdown first.
  useEffect(() => {
    if (!userId) return;
    const hasCached = (notifsCache.get(userId)?.length ?? 0) > 0;
    void fetchNotifications(!hasCached);

    const interval = window.setInterval(() => {
      void fetchNotifications(false);
    }, POLL_INTERVAL_MS);

    const onRefreshSignal = (): void => {
      void fetchNotifications(false);
    };

    window.addEventListener('focus', onRefreshSignal);
    window.addEventListener('homehealth:notification-received', onRefreshSignal);
    window.addEventListener('homehealth:staff-status-changed', onRefreshSignal);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onRefreshSignal);
      window.removeEventListener('homehealth:notification-received', onRefreshSignal);
      window.removeEventListener('homehealth:staff-status-changed', onRefreshSignal);
    };
  }, [userId, fetchNotifications]);

  // Also refresh whenever the user opens the dropdown
  useEffect(() => {
    if (!open || !userId) return;
    const hasCached = (notifsCache.get(userId)?.length ?? 0) > 0;
    void fetchNotifications(!hasCached);
  }, [open, userId, fetchNotifications]);

  const unread = notifs.filter((n) => new Date(n.createdAt).getTime() > lastRead).length;

  const handleMarkRead = (): void => {
    const newestTime = notifs.reduce(
      (max, n) => Math.max(max, new Date(n.createdAt).getTime()),
      Date.now(),
    );
    const ts = saveLastRead(userId, newestTime);
    setLastRead(ts);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-ink-600 hover:bg-ink-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[1rem] px-1 rounded-full bg-danger-500 text-white text-2xs font-bold flex items-center justify-center leading-none shadow-xs animate-scale-in">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-lg ring-1 ring-ink-100 z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-ink-50/40">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-brand-100 text-brand-700">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkRead}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-ink-50">
            {loading && notifs.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">No notifications yet</div>
            ) : (
              notifs.map((n) => {
                const meta = TEMPLATE_META[n.templateCode as TemplateCode];
                const isUnread = new Date(n.createdAt).getTime() > lastRead;
                const isVerifiedCard = n.templateCode === 'STAFF_VERIFIED';
                const Icon = meta?.Icon ?? Bell;
                const color = meta?.color ?? 'text-ink-400';
                const href = buildNotificationLink(role, n.templateCode, n.bookingId, n.staffUserId);
                const titleLabel =
                  role === 'ADMIN' && meta?.adminLabel
                    ? meta.adminLabel
                    : meta?.label ?? n.templateCode;

                const inner = (
                  <>
                    <div
                      className={clsx(
                        'mt-0.5 flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center',
                        isVerifiedCard
                          ? 'bg-emerald-100 text-emerald-700'
                          : isUnread
                          ? 'bg-brand-100/80 ' + color
                          : 'bg-ink-100/70 ' + color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={clsx(
                          'text-xs font-semibold',
                          isVerifiedCard ? 'text-emerald-900' : 'text-ink-900',
                        )}
                      >
                        {titleLabel}
                      </p>
                      <p
                        className={clsx(
                          'text-xs mt-0.5 line-clamp-3 leading-relaxed',
                          isVerifiedCard ? 'text-emerald-800' : 'text-ink-600',
                        )}
                      >
                        {n.renderedContent}
                      </p>
                      <p className="text-2xs text-ink-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1.5">
                        <span className="h-2 w-2 rounded-full bg-brand-500 block" />
                      </div>
                    )}
                  </>
                );

                const rowClass = clsx(
                  'flex gap-3 px-4 py-3.5 transition-colors w-full text-left',
                  isVerifiedCard && isUnread
                    ? 'bg-emerald-50/70 hover:bg-emerald-50'
                    : isUnread
                    ? 'bg-brand-50/60 hover:bg-brand-50'
                    : 'hover:bg-ink-50',
                  href && 'cursor-pointer',
                );

                return href ? (
                  <Link
                    key={n.id}
                    to={href}
                    className={rowClass}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className={rowClass}>
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
