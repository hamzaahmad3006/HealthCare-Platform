import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import { formatDateTime } from '../../helper/format';

type TemplateCode =
  | 'BOOKING_RECEIVED'
  | 'BOOKING_CONFIRMED'
  | 'STAFF_ASSIGNED'
  | 'STAFF_EN_ROUTE'
  | 'VISIT_COMPLETED'
  | 'REPORT_AVAILABLE';

interface NotifItem {
  id: string;
  templateCode: string;
  renderedContent: string;
  bookingId: string | null;
  createdAt: string;
  sentAt: string | null;
}

const TEMPLATE_META: Record<TemplateCode, { label: string; Icon: React.ElementType; color: string }> = {
  BOOKING_RECEIVED:  { label: 'Booking received',   Icon: CalendarClock,  color: 'text-brand-500' },
  BOOKING_CONFIRMED: { label: 'Booking confirmed',  Icon: CalendarCheck,  color: 'text-success-600' },
  STAFF_ASSIGNED:    { label: 'Staff assigned',      Icon: ClipboardList,  color: 'text-brand-500' },
  STAFF_EN_ROUTE:    { label: 'Staff on the way',    Icon: MapPin,         color: 'text-accent-600' },
  VISIT_COMPLETED:   { label: 'Visit completed',     Icon: CheckCircle2,   color: 'text-success-600' },
  REPORT_AVAILABLE:  { label: 'New report available',Icon: FileText,       color: 'text-info-600' },
};

const LAST_READ_KEY = 'notif_last_read';

function getLastRead(): number {
  return parseInt(localStorage.getItem(LAST_READ_KEY) ?? '0', 10);
}

function markAllRead(): void {
  localStorage.setItem(LAST_READ_KEY, String(Date.now()));
}

export function NotificationBell(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRead, setLastRead] = useState(getLastRead);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get<{ success: true; data: NotifItem[] }>(API.NOTIFICATIONS)
      .then(({ data }) => setNotifs(data.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [open]);

  const unread = notifs.filter((n) => new Date(n.createdAt).getTime() > lastRead).length;

  const handleOpen = (): void => {
    setOpen((v) => !v);
  };

  const handleMarkRead = (): void => {
    markAllRead();
    setLastRead(Date.now());
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-ink-600 hover:bg-ink-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[1rem] px-0.5 rounded-full bg-danger-500 text-white text-2xs font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg ring-1 ring-ink-100 z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkRead}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-ink-50">
            {loading ? (
              <div className="py-8 text-center text-sm text-ink-400">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center text-sm text-ink-400">No notifications yet</div>
            ) : (
              notifs.map((n) => {
                const meta = TEMPLATE_META[n.templateCode as TemplateCode];
                const isUnread = new Date(n.createdAt).getTime() > lastRead;
                const Icon = meta?.Icon ?? Bell;
                const color = meta?.color ?? 'text-ink-400';
                return (
                  <div
                    key={n.id}
                    className={clsx(
                      'flex gap-3 px-4 py-3 transition-colors',
                      isUnread ? 'bg-brand-50/60' : 'hover:bg-ink-50',
                    )}
                  >
                    <div className={clsx('mt-0.5 flex-shrink-0', color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink-900">
                        {meta?.label ?? n.templateCode}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.renderedContent}
                      </p>
                      <p className="text-2xs text-ink-400 mt-1">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 block" />
                      </div>
                    )}
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
