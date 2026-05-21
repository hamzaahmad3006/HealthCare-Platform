import { ReactNode } from 'react';
import { ShieldCheck, Clock, XCircle } from 'lucide-react';
import { useAppSelector } from '../../redux/store';
import { SidebarLayout } from '../admin/SidebarLayout';

// Sits between ProtectedRoute and the staff dashboard. ADMIN passes through
// untouched. STAFF with verificationStatus === 'VERIFIED' also passes through.
// Otherwise we show a non-redirecting status screen so the user never gets
// trapped in a /complete-profile <-> /staff/visits loop.
export function StaffVerificationGate({ children }: { children: ReactNode }): JSX.Element {
  const user = useAppSelector((s) => s.auth.user);

  if (!user || user.role !== 'STAFF') return <>{children}</>;

  const status = user.staffVerificationStatus;
  if (status === 'VERIFIED') return <>{children}</>;

  const rejected = status === 'REJECTED';
  const Icon = rejected ? XCircle : Clock;
  const heading = rejected ? 'Verification rejected' : 'Awaiting verification';
  const body = rejected
    ? 'Your account has been rejected. Please contact admin for next steps.'
    : 'Your profile has been submitted. Admin will review your documents and verify you shortly. You can refresh this page to check status.';
  const accent = rejected ? 'text-danger-700 bg-danger-50 ring-danger-200' : 'text-accent-700 bg-accent-50 ring-accent-200';

  return (
    <SidebarLayout title="Account Status">
      <div className="max-w-xl mx-auto mt-10">
        <div className={`rounded-2xl ring-1 p-8 ${accent} flex items-start gap-4`}>
          <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{heading}</h2>
            <p className="text-sm mt-2 leading-relaxed">{body}</p>
            {!rejected ? (
              <p className="text-xs mt-4 inline-flex items-center gap-1.5 opacity-80">
                <ShieldCheck className="h-3.5 w-3.5" />
                Once verified, you will see your visit assignments here.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
