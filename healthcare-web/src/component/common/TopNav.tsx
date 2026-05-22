import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Menu, X, LogOut, User as UserIcon, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '../../constant/Button';
import type { RootState } from '../../redux/store';
import { clearAuth } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';

interface NavLinkSpec {
  to: string;
  label: string;
  hash?: boolean;
}

const PUBLIC_LINKS: NavLinkSpec[] = [
  { to: '/#services', label: 'Services', hash: true },
  { to: '/#how', label: 'How it works', hash: true },
  { to: '/#trust', label: 'Why us', hash: true },
];

const AUTH_LINKS: NavLinkSpec[] = [
  { to: '/my-bookings', label: 'My bookings' },
];

interface TopNavProps {
  variant?: 'transparent' | 'solid';
}

export function TopNav({ variant = 'solid' }: TopNavProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  const isLoggedIn = Boolean(accessToken);
  const isAdmin = user?.role === 'ADMIN';
  const links = isLoggedIn ? AUTH_LINKS : PUBLIC_LINKS;

  const handleLogout = async (): Promise<void> => {
    try {
      await api.post(API.AUTH.LOGOUT);
    } catch {
      // ignore — local sign-out is what matters
    }
    dispatch(clearAuth());
    setMobileOpen(false);
    navigate('/');
  };

  const wrapperClass = clsx(
    'sticky top-0 z-40 transition-colors',
    variant === 'transparent'
      ? 'glass border-b border-ink-100/60'
      : 'bg-white border-b border-ink-100',
  );

  const isActive = (to: string): boolean => {
    if (to.startsWith('/#')) return false;
    return location.pathname === to;
  };

  return (
    <header className={wrapperClass}>
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/assets/logo-icon.jpg"
            alt=""
            aria-hidden
            className="h-10 w-10 object-contain"
          />
          <div className="leading-tight">
            <p className="font-bold text-ink-900">HomeHealth</p>
            <p className="text-2xs text-ink-500 -mt-0.5">Faisalabad</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink-600">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                'transition-colors',
                isActive(link.to) ? 'text-ink-900' : 'hover:text-ink-900',
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin ? (
            <Link to="/admin" className="hover:text-ink-900 transition-colors">
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-ink-700">
                <div className="h-7 w-7 rounded-full bg-gradient-brand text-white flex items-center justify-center text-xs font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase() ?? <UserIcon className="h-3.5 w-3.5" />}
                </div>
                <span className="font-medium max-w-[140px] truncate">{user?.fullName ?? 'Account'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
                aria-label="Sign out"
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/book">
                <Button size="sm">Book now</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-ink-700 hover:bg-ink-100"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="md:hidden border-t border-ink-100 bg-white animate-slide-down">
          <div className="px-6 py-4 space-y-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2 text-sm font-medium text-ink-700 hover:text-ink-900"
              >
                {link.hash ? null : <Calendar className="h-4 w-4 text-ink-400" />}
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-2 text-sm font-medium text-ink-700 hover:text-ink-900"
              >
                Admin dashboard
              </Link>
            ) : null}

            <div className="pt-3 border-t border-ink-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <Button variant="ghost" fullWidth onClick={handleLogout} leftIcon={<LogOut className="h-4 w-4" />}>
                  Sign out
                </Button>
              ) : (
                <>
                  <Link to="/auth/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" fullWidth>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/book" onClick={() => setMobileOpen(false)}>
                    <Button fullWidth>Book now</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
