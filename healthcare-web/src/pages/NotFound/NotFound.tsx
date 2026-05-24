import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, HeartPulse } from 'lucide-react';
import { Button } from '../../constant/Button';
import { useAppSelector } from '../../redux/store';

export function NotFound(): JSX.Element {
  const navigate = useNavigate();
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const isAuthenticated = !!(accessToken && user);

  const homeLink =
    user?.role === 'ADMIN' ? '/admin' :
    user?.role === 'STAFF'  ? '/staff/visits' :
    isAuthenticated         ? '/my-bookings'  : '/';

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center px-6">

      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent-100 opacity-30 blur-3xl" />
      </div>

      <div className="text-center max-w-lg animate-slide-up">

        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="h-20 w-20 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <HeartPulse className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* 404 */}
        <p className="text-[120px] font-black leading-none tracking-tighter bg-gradient-to-br from-brand-300 to-brand-600 bg-clip-text text-transparent select-none">
          404
        </p>

        {/* Heading */}
        <h1 className="mt-2 text-2xl font-bold text-ink-900">
          Page not found
        </h1>
        <p className="mt-3 text-ink-500 leading-relaxed">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
          Let&rsquo;s get you back on track.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
          <Link to={homeLink}>
            <Button leftIcon={<Home className="h-4 w-4" />}>
              {user?.role === 'ADMIN' ? 'Back to dashboard' :
               user?.role === 'STAFF' ? 'Back to my visits' :
               isAuthenticated ? 'Back to my bookings' : 'Back to home'}
            </Button>
          </Link>
        </div>

        {/* Brand footer */}
        <p className="mt-12 text-xs text-ink-400">
          HomeHealth Faisalabad &mdash; Professional home healthcare services
        </p>
      </div>
    </div>
  );
}
