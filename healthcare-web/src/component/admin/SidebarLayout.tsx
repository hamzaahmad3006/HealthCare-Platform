import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Activity,
  FileText,
  Star,
  LogOut,
  Menu,
  X,
  Heart,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { clearAuth } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';

interface SidebarLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarClock },
  { to: '/admin/staff', label: 'Staff', icon: Users },
  { to: '/admin/visits', label: 'Visits', icon: Activity },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
] as const;

export function SidebarLayout({ children, title, description, actions }: SidebarLayoutProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await api.post(API.AUTH.LOGOUT).catch(() => null);
    dispatch(clearAuth());
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-ink-100 fixed inset-y-0 left-0 z-30">
        <SidebarContent onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} userName={user?.fullName ?? '—'} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen ? (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink-950/40 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 animate-slide-up">
            <SidebarContent
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
              userName={user?.fullName ?? '—'}
            />
          </aside>
        </>
      ) : null}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-ink-100 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-ink-100 text-ink-700"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-ink-900 truncate">{title}</h1>
                {description ? <p className="text-sm text-ink-500 truncate">{description}</p> : null}
              </div>
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  onLogout,
  userName,
}: {
  onNavigate: () => void;
  onLogout: () => void | Promise<void>;
  userName: string;
}): JSX.Element {
  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-ink-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <div>
            <p className="font-bold text-ink-900 leading-tight">HomeHealth</p>
            <p className="text-2xs text-ink-500">Admin Console</p>
          </div>
        </div>
        <button
          className="lg:hidden p-1.5 rounded-lg hover:bg-ink-100 text-ink-500"
          onClick={onNavigate}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={'end' in item ? item.end : false}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-brand-soft text-brand-800 ring-1 ring-brand-500/20'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )
            }
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-ink-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-400">Signed in as</p>
          <p className="text-sm font-semibold text-ink-800 truncate">{userName}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-600 hover:bg-danger-50 hover:text-danger-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );
}
