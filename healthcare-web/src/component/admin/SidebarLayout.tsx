import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Activity,
  FileText,
  FolderUp,
  UserCircle,
  Star,
  LogOut,
  KeyRound,
  Menu,
  X,
  HeartPulse,
  BarChart2,
  Settings,
  ClipboardList,
  Banknote,
  UserSquare2,
  Bell,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppSelector } from '../../redux/store';
import { useLogout } from '../../hooks/useLogout';
import { NotificationBell } from '../common/NotificationBell';
import { BrandLogo } from '../common/BrandLogo';
import { formatPhone } from '../../helper/format';

interface SidebarLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview & Triage',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/bookings', label: 'Bookings', icon: CalendarClock },
      { to: '/admin/visits', label: 'Field Visits', icon: Activity },
    ],
  },
  {
    label: 'Clinical & Community',
    items: [
      { to: '/admin/customers', label: 'Patients', icon: Users },
      { to: '/admin/staff', label: 'Medical Staff', icon: Users },
      { to: '/admin/reviews', label: 'Reviews & CSAT', icon: Star },
    ],
  },
  {
    label: 'Intelligence & Revenue',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
      { to: '/admin/payments', label: 'Payments', icon: Banknote },
      { to: '/admin/reports', label: 'Care Reports', icon: FileText },
    ],
  },
  {
    label: 'System & Security',
    items: [
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const STAFF_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Field Ops',
    items: [
      { to: '/staff/visits', label: 'My Visits', icon: Activity },
      { to: '/staff/doctor-requests', label: 'Doctor Requests', icon: UserSquare2 },
      { to: '/staff/patients', label: 'My Patients', icon: HeartPulse },
    ],
  },
  {
    label: 'Clinical Records & Profile',
    items: [
      { to: '/staff/reports', label: 'My Reports', icon: FileText },
      { to: '/staff/documents', label: 'My Documents', icon: FolderUp },
      { to: '/staff/profile', label: 'My Profile', icon: UserCircle },
    ],
  },
];

export function SidebarLayout({ children, title, description, actions }: SidebarLayoutProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const logout = useLogout();

  const handleLogout = (): Promise<void> => logout('/auth/login');
  const isStaff = user?.role === 'STAFF';

  return (
    <div className="min-h-screen bg-ink-50/70 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-ink-200/80 fixed inset-y-0 left-0 z-30 shadow-[1px_0_12px_rgba(15,23,42,0.03)]">
        <SidebarContent
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
          userName={user?.fullName ?? 'Care Officer'}
          userPhone={user?.phone ?? ''}
          role={user?.role ?? 'ADMIN'}
          isStaff={isStaff}
          isDoctor={Boolean(user?.isDoctor)}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen ? (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink-950/50 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-2xl z-50 animate-slide-up flex flex-col">
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              userName={user?.fullName ?? 'Care Officer'}
              userPhone={user?.phone ?? ''}
              role={user?.role ?? 'ADMIN'}
              isStaff={isStaff}
              isDoctor={Boolean(user?.isDoctor)}
            />
          </aside>
        </>
      ) : null}

      {/* Main Container */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="bg-white/95 backdrop-blur border-b border-ink-100 sticky top-0 z-20 transition-all">
          <div className="px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 rounded-xl border border-ink-200/80 hover:bg-ink-100 text-ink-700 transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-ink-900 tracking-tight truncate">{title}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
                    Faisalabad HQ
                  </span>
                </div>
                {description ? <p className="text-xs sm:text-sm text-ink-500 truncate mt-0.5">{description}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              {actions}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  onLogout,
  userName,
  userPhone,
  role,
  isStaff,
  isDoctor,
}: {
  onNavigate: () => void;
  onLogout: () => void | Promise<void>;
  userName: string;
  userPhone: string;
  role: string;
  isStaff: boolean;
  isDoctor?: boolean;
}): JSX.Element {
  const groups = isStaff
    ? STAFF_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.to === '/staff/doctor-requests') {
            return Boolean(isDoctor);
          }
          return true;
        }),
      }))
    : ADMIN_NAV_GROUPS;

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || 'AD';

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
        <BrandLogo
          asLink
          to={isStaff ? '/staff/dashboard' : '/admin'}
          size="md"
          subtitleText={isStaff ? 'STAFF PORTAL' : 'ADMIN CONSOLE'}
        />
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors"
          onClick={onNavigate}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-thin">
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-ink-400 select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      'group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-50/90 text-brand-900 font-semibold ring-1 ring-brand-500/25 shadow-xs'
                        : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-brand-600" />
                        )}
                        <item.icon
                          className={clsx(
                            'h-4 w-4 flex-shrink-0 transition-transform duration-150',
                            isActive ? 'text-brand-700' : 'text-ink-400 group-hover:text-ink-700',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="ml-auto text-2xs font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Sign-out footer */}
      <div className="p-3 border-t border-ink-100 bg-ink-50/40">
        <div className="p-2.5 rounded-xl bg-white border border-ink-100 shadow-xs mb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white text-xs font-bold tracking-wide shadow-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-ink-900 truncate">{userName}</p>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-ink-100 text-ink-700">
                  {role}
                </span>
              </div>
              <p className="text-2xs text-ink-400 truncate flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {userPhone ? formatPhone(userPhone) : 'Active session'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <NavLink
            to={isStaff ? '/staff/change-password' : '/admin/change-password'}
            onClick={onNavigate}
            title="Change password"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-2xs font-semibold text-ink-600 bg-white border border-ink-100 hover:bg-ink-100 hover:text-ink-900 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-ink-400" />
            Security
          </NavLink>
          <button
            onClick={onLogout}
            title="Sign out of console"
            className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-2xs font-semibold text-danger-700 bg-danger-50/60 border border-danger-200/50 hover:bg-danger-100 hover:text-danger-800 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-danger-600" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
