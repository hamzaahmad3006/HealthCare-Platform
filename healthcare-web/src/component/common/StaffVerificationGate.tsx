import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Clock, XCircle, Upload, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { setUser } from '../../redux/slices/authSlice';
import { api } from '../../helper/axios';
import { API } from '../../constant/apiUrls';
import type { UserProfile } from '../../types/auth.types';
import { SidebarLayout } from '../admin/SidebarLayout';

const STATUS_POLL_MS = 6_000;

// Sits between ProtectedRoute and the staff dashboard. ADMIN passes through
// untouched. STAFF with verificationStatus === 'VERIFIED' also passes through.
// Otherwise we show an actionable status screen so the staff member clearly
// sees their activation checklist and can upload missing documents.
export function StaffVerificationGate({ children }: { children: ReactNode }): JSX.Element {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const waiting = user?.role === 'STAFF' && user.staffVerificationStatus !== 'VERIFIED';

  // While waiting for admin review, re-check status on an interval, on tab
  // focus and on any foreground push — so the gate unlocks without re-login.
  useEffect(() => {
    if (!waiting) return;
    let cancelled = false;
    const refresh = async (): Promise<void> => {
      try {
        const { data } = await api.get<{ success: true; data: UserProfile }>(API.AUTH.ME);
        if (cancelled) return;
        if (data.data.staffVerificationStatus !== user?.staffVerificationStatus) {
          dispatch(setUser({ ...user, ...data.data }));
          if (data.data.staffVerificationStatus === 'VERIFIED') {
            toast.success('Your account has been verified — you can now receive visits!');
          }
        }
      } catch {
        // Best-effort; next tick retries.
      }
    };
    const interval = window.setInterval(() => void refresh(), STATUS_POLL_MS);
    const onFocus = (): void => void refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('homehealth:staff-status-changed', onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('homehealth:staff-status-changed', onFocus);
    };
  }, [waiting, user, dispatch]);

  if (!user || user.role !== 'STAFF') return <>{children}</>;

  const status = user.staffVerificationStatus;
  if (status === 'VERIFIED') return <>{children}</>;

  const rejected = status === 'REJECTED';
  const Icon = rejected ? XCircle : Clock;
  const heading = rejected ? 'Verification Rejected' : 'Onboarding in Progress';
  const body = rejected
    ? 'Your clinical documents were reviewed and rejected by medical administration. Please contact support or upload corrected credentials.'
    : 'Your operational profile has been submitted. To start receiving patient visit assignments, please upload your verification documents (CNIC copy, PMC/PNC license or degree).';
  const accent = rejected
    ? 'text-danger-800 bg-danger-50 ring-danger-200'
    : 'text-ink-900 bg-white ring-ink-200 shadow-card';

  return (
    <SidebarLayout title="Account Status">
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <div className={`rounded-3xl ring-1 p-6 sm:p-8 ${accent}`}>
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                rejected ? 'bg-danger-100 text-danger-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-ink-900">{heading}</h2>
                <span
                  className={`text-2xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                    rejected
                      ? 'bg-danger-100 text-danger-700'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {status ?? 'PENDING'}
                </span>
              </div>
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">{body}</p>

              {/* 3-Step Verification Checklist */}
              {!rejected ? (
                <div className="mt-6 pt-5 border-t border-ink-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Activation Checklist
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2.5 text-emerald-700 font-semibold bg-emerald-50/80 px-3 py-2 rounded-xl ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Step 1: Clinical Profile Credentials (CNIC, city, services) completed</span>
                    </div>

                    <div className="flex items-center justify-between gap-2.5 text-amber-900 font-semibold bg-amber-50/80 px-3 py-2 rounded-xl ring-1 ring-amber-200">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Step 2: Upload PMDC/PNC License &amp; CNIC copy</span>
                      </div>
                      <span className="text-2xs bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                        Action Required
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-ink-500 px-3 py-2 rounded-xl bg-ink-50">
                      <Clock className="h-4 w-4 text-ink-400 shrink-0" />
                      <span>Step 3: Medical administration review &amp; live patient dispatch</span>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="mt-6 pt-4 flex flex-wrap items-center gap-3">
                    <Link
                      to="/staff/documents"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Documents Now</span>
                      <ArrowRight className="h-4 w-4 ml-0.5" />
                    </Link>

                    <Link
                      to="/staff/profile"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-ink-50 text-ink-700 font-semibold text-sm ring-1 ring-ink-200 transition-all"
                    >
                      View Profile Details
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
