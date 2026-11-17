import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  CalendarClock,
  MapPin,
  FileText,
  UserSquare2,
  RefreshCw,
  CheckCheck,
  ArrowRight,
  PartyPopper,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { Card } from '../../../constant/Card';
import { EmptyState } from '../../../component/common/EmptyState';
import { formatDateTime } from '../../../helper/format';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import { buildNotificationLink } from '../../../helper/notificationLink';
import { useAppSelector } from '../../../redux/store';

interface NotifItem {
  id: string;
  templateCode: string;
  renderedContent: string;
  bookingId: string | null;
  bookingVisitId: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

const LAST_READ_KEY = 'notif_last_read';

function getLastRead(): number {
  return parseInt(localStorage.getItem(LAST_READ_KEY) ?? '0', 10);
}

function saveLastRead(): void {
  localStorage.setItem(LAST_READ_KEY, String(Date.now()));
}

export function StaffNotifications(): JSX.Element {
  const role = useAppSelector((s) => s.auth.user?.role);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRead, setLastRead] = useState(getLastRead);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: true; data: NotifItem[] }>(API.NOTIFICATIONS.LIST);
      setNotifs(data.data);
    } catch (err) {
      setError(extractApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    const onStatusChange = (): void => {
      void loadNotifications();
    };

    window.addEventListener('homehealth:staff-status-changed', onStatusChange);
    window.addEventListener('focus', onStatusChange);

    return () => {
      window.removeEventListener('homehealth:staff-status-changed', onStatusChange);
      window.removeEventListener('focus', onStatusChange);
    };
  }, [loadNotifications]);

  const handleMarkAllRead = (): void => {
    saveLastRead();
    setLastRead(Date.now());
  };

  const unreadCount = notifs.filter((n) => new Date(n.createdAt).getTime() > lastRead).length;

  const getTemplateConfig = (code: string) => {
    switch (code) {
      case 'STAFF_VERIFIED':
        return {
          title: 'Account Verified 🎉',
          badge: 'Celebration',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          cardBorder: 'border-emerald-300 bg-gradient-to-r from-emerald-50/70 to-teal-50/50',
          icon: PartyPopper,
          iconClass: 'text-emerald-600 bg-emerald-100',
          actionText: 'Go to Visits',
          actionLink: '/staff/visits',
        };
      case 'STAFF_ASSIGNED':
        return {
          title: 'New Patient Visit Assigned',
          badge: 'Assignment',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          cardBorder: 'border-blue-200 bg-blue-50/40',
          icon: ClipboardList,
          iconClass: 'text-blue-600 bg-blue-100',
          actionText: 'View Visit Details',
          actionLink: '/staff/visits',
        };
      case 'STAFF_EN_ROUTE':
        return {
          title: 'En Route Alert',
          badge: 'Dispatch',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          cardBorder: 'border-amber-200 bg-amber-50/40',
          icon: MapPin,
          iconClass: 'text-amber-600 bg-amber-100',
          actionText: 'View Visit',
          actionLink: '/staff/visits',
        };
      case 'DOCTOR_BOOKING_REQUESTED':
        return {
          title: 'New Doctor Booking Request',
          badge: 'Request',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          cardBorder: 'border-purple-200 bg-purple-50/40',
          icon: UserSquare2,
          iconClass: 'text-purple-600 bg-purple-100',
          actionText: 'Respond to Request',
          actionLink: '/staff/doctor-requests',
        };
      case 'VISIT_REMINDER':
        return {
          title: 'Upcoming Visit Reminder',
          badge: 'Reminder',
          badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
          cardBorder: 'border-orange-200 bg-orange-50/40',
          icon: CalendarClock,
          iconClass: 'text-orange-600 bg-orange-100',
          actionText: 'Check Schedule',
          actionLink: '/staff/visits',
        };
      case 'REPORT_AVAILABLE':
        return {
          title: 'Health Report Available',
          badge: 'Report',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          cardBorder: 'border-indigo-200 bg-indigo-50/40',
          icon: FileText,
          iconClass: 'text-indigo-600 bg-indigo-100',
          actionText: 'View Reports',
          actionLink: '/staff/reports',
        };
      default:
        return {
          title: code.replace(/_/g, ' '),
          badge: 'Alert',
          badgeClass: 'bg-ink-100 text-ink-800 border-ink-200',
          cardBorder: 'border-ink-200 bg-white',
          icon: Bell,
          iconClass: 'text-ink-600 bg-ink-100',
          actionText: null,
          actionLink: null,
        };
    }
  };

  return (
    <SidebarLayout
      title="Notifications"
      description="Real-time alerts for staff verification, new visit assignments, and patient updates"
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-xl transition-colors"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {loading && notifs.length === 0 ? (
          <div className="py-20 text-center text-ink-400 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading notifications...
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-danger-600 text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="mt-3 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl"
            >
              Retry
            </button>
          </Card>
        ) : notifs.length === 0 ? (
          <Card className="p-12 text-center">
            <EmptyState
              title="No notifications yet"
              description="When your account gets verified or new visits and tasks are assigned to you, real-time alerts will appear here."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => {
              const isUnread = new Date(n.createdAt).getTime() > lastRead;
              const config = getTemplateConfig(n.templateCode);
              const Icon = config.icon;
              const link = buildNotificationLink(role, n.templateCode, n.bookingId) || config.actionLink;

              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-5 transition-all shadow-xs ${
                    isUnread ? 'ring-2 ring-brand-500/20' : ''
                  } ${config.cardBorder}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${config.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-ink-900">{config.title}</h2>
                          <span
                            className={`text-2xs uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                          >
                            {config.badge}
                          </span>
                        </div>
                        <span className="text-xs text-ink-400 font-medium">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-ink-700 mt-2 leading-relaxed">
                        {n.renderedContent}
                      </p>

                      {link && (
                        <div className="mt-3.5 pt-3 border-t border-ink-100/60 flex items-center justify-between">
                          <Link
                            to={link}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
                          >
                            <span>{config.actionText ?? 'View Details'}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-brand-600 bg-brand-100/70 px-2 py-0.5 rounded-md">
                              New
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
