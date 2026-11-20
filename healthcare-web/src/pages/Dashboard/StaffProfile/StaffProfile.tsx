import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Briefcase,
  Camera,
  User as UserIcon,
  Loader2,
  Power,
  Pencil,
  X,
  Save,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  MessageSquareQuote,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { Card } from '../../../constant/Card';
import { Badge } from '../../../constant/Badge';
import { Input } from '../../../constant/Input';
import { Button } from '../../../constant/Button';
import { formatDate } from '../../../helper/format';
import { useStaffProfile } from './useStaffProfile';

export function StaffProfile(): JSX.Element {
  const p = useStaffProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (p.profile) {
      setEditFullName(p.profile.user.fullName ?? '');
      setEditEmail(p.profile.user.email ?? '');
    }
  }, [p.profile]);

  if (p.isLoading) {
    return (
      <SidebarLayout title="My Profile">
        <LoadingSpinner size="lg" label="Loading profile…" className="py-20" />
      </SidebarLayout>
    );
  }

  if (p.error || !p.profile) {
    return (
      <SidebarLayout title="My Profile">
        <div className="mt-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {p.error ?? 'Profile not available'}
        </div>
      </SidebarLayout>
    );
  }

  const profile = p.profile;
  const avatar = profile.user.avatarUrl;

  const handleFilePick = (): void => fileInputRef.current?.click();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await p.uploadAvatar(file);
  };

  const handleOpenEdit = (): void => {
    setEditFullName(profile.user.fullName ?? '');
    setEditEmail(profile.user.email ?? '');
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setEditError('Full name is required');
      return;
    }
    setEditError(null);
    const success = await p.updateProfile({
      fullName: editFullName.trim(),
      email: editEmail.trim() || undefined,
    });
    if (success) {
      setEditModalOpen(false);
    }
  };

  return (
    <SidebarLayout
      title="My Profile"
      description="Manage your clinician credentials, personal information, and clinical services"
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Avatar & Identity Card */}
        <Card padding="md" className="lg:col-span-1 shadow-card rounded-2xl border border-ink-100">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={profile.user.fullName}
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-brand-100 shadow-sm"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center ring-4 ring-brand-100 shadow-sm">
                  <UserIcon className="h-14 w-14" />
                </div>
              )}
              <button
                type="button"
                onClick={handleFilePick}
                disabled={p.isUploadingAvatar}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-brand-600 text-white shadow-md flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-ink-900 tracking-tight">{profile.user.fullName}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-ink-100 text-ink-700">
                {profile.staffCode}
              </span>
              <StatusBadge status={profile.verificationStatus} kind="verif" size="sm" />
            </div>

            {/* Quick Actions */}
            <div className="mt-5 w-full space-y-2.5">
              <button
                type="button"
                onClick={handleOpenEdit}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 shadow-2xs active:scale-98 transition-all"
              >
                <Pencil className="h-4 w-4 text-brand-600" />
                <span>Edit Personal Info</span>
              </button>

              <button
                type="button"
                onClick={() => void p.toggleAvailability()}
                disabled={p.isTogglingAvailability}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-98 disabled:opacity-50 ${
                  profile.isAvailable
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                    : 'bg-ink-100 text-ink-600 border-ink-200 hover:bg-ink-200'
                }`}
              >
                {p.isTogglingAvailability ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Power className={`h-4 w-4 ${profile.isAvailable ? 'text-emerald-600' : 'text-ink-400'}`} />
                )}
                <span>
                  {p.isTogglingAvailability
                    ? 'Saving…'
                    : profile.isAvailable
                    ? 'Available for Visits'
                    : 'Offline / Unavailable'}
                </span>
              </button>
            </div>

            <p className="text-2xs text-ink-400 mt-4">
              Profile photo: JPG or PNG · max 5 MB
            </p>
          </div>
        </Card>

        {/* Right — Contact & Professional Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Details Card */}
          <Card padding="md" className="shadow-card rounded-2xl border border-ink-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900">Personal &amp; Contact</h3>
                <p className="text-xs text-ink-500">Your reachability and location info</p>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <ul className="space-y-3.5 divide-y divide-ink-50">
              <DetailRow
                icon={<UserIcon className="h-4 w-4 text-brand-600" />}
                label="Full Name"
                value={profile.user.fullName}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4 text-brand-600" />}
                label="Phone Number"
                value={profile.user.phone}
              />
              <DetailRow
                icon={<Mail className="h-4 w-4 text-brand-600" />}
                label="Email Address"
                value={profile.user.email ?? 'No email linked'}
              />
              <DetailRow
                icon={<MapPin className="h-4 w-4 text-brand-600" />}
                label="Location"
                value={
                  profile.city
                    ? profile.zone
                      ? `${profile.zone.name}, ${profile.city.name}`
                      : profile.city.name
                    : 'Not specified'
                }
              />
            </ul>
          </Card>

          {/* Professional Credentials Card */}
          <Card padding="md" className="shadow-card rounded-2xl border border-ink-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900">Clinical Credentials</h3>
                <p className="text-xs text-ink-500">Verification details, CNIC, and experience</p>
              </div>
              <Link
                to="/complete-profile"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Details</span>
              </Link>
            </div>

            <ul className="space-y-3.5 divide-y divide-ink-50">
              <DetailRow
                icon={<BadgeCheck className="h-4 w-4 text-brand-600" />}
                label="13-Digit CNIC"
                value={profile.cnic ?? 'Not provided'}
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4 text-brand-600" />}
                label="Gender"
                value={profile.gender ?? 'Not specified'}
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4 text-brand-600" />}
                label="Date of Birth"
                value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}
              />
              <DetailRow
                icon={<Briefcase className="h-4 w-4 text-brand-600" />}
                label="Clinical Experience"
                value={`${profile.experienceYears} year${profile.experienceYears === 1 ? '' : 's'}`}
              />
              {profile.ambulanceNumber ? (
                <DetailRow
                  icon={<Briefcase className="h-4 w-4 text-brand-600" />}
                  label="Ambulance Number"
                  value={profile.ambulanceNumber}
                />
              ) : null}
            </ul>
          </Card>

          {/* Services Offered Card */}
          <Card padding="md" className="shadow-card rounded-2xl border border-ink-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900">Deliverable Services</h3>
                <p className="text-xs text-ink-500">Medical services you are certified to perform</p>
              </div>
              <Link
                to="/complete-profile"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800 transition-colors"
              >
                <span>Change Services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {profile.serviceTypes.length === 0 ? (
              <p className="text-sm text-ink-400 italic">No services selected</p>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.serviceTypes.map((st) => (
                  <Badge key={st.serviceType.id} tone="brand">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-brand-600" />
                    {st.serviceType.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Customer Reviews & Ratings Card */}
          <Card padding="md" className="shadow-card rounded-2xl border border-ink-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-brand-600" />
                  <span>Customer Reviews &amp; Ratings</span>
                </h3>
                <p className="text-xs text-ink-500">
                  Feedback submitted by customers after your completed home visits
                </p>
              </div>
              {profile.reviewSummary && profile.reviewSummary.totalReviews > 0 ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  <span className="text-sm font-extrabold text-amber-900">
                    {profile.reviewSummary.averageRating} / 5.0
                  </span>
                  <span className="text-xs font-medium text-amber-700">
                    ({profile.reviewSummary.totalReviews}{' '}
                    {profile.reviewSummary.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              ) : null}
            </div>

            {!profile.reviewSummary || profile.reviewSummary.recentReviews.length === 0 ? (
              <div className="rounded-xl bg-ink-50/70 border border-dashed border-ink-200 px-4 py-6 text-center">
                <Star className="h-7 w-7 text-ink-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-700">No customer reviews yet</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  Customer ratings and comments will appear here once visits are reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.reviewSummary.recentReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-xl bg-ink-50/60 border border-ink-100 p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink-900">{rev.customerName}</span>
                        {rev.bookingNumber ? (
                          <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-white border border-ink-200 text-ink-600">
                            {rev.bookingNumber}
                          </span>
                        ) : null}
                        {rev.serviceName ? (
                          <span className="text-2xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                            {rev.serviceName}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-sm font-bold text-amber-500 tracking-wider">
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                      </span>
                    </div>
                    <p className="text-xs text-ink-700 leading-relaxed italic">
                      {rev.reviewText ? `"${rev.reviewText}"` : 'Customer submitted a star rating without comments.'}
                    </p>
                    <p className="text-2xs text-ink-400">{formatDate(rev.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Edit Personal Info Modal ── */}
      {editModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-ink-100 w-full max-w-md overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-ink-50/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-ink-900">Edit Personal Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <Input
                label="Full Name"
                placeholder="Dr. / Staff Name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
                leftIcon={<UserIcon className="h-4 w-4" />}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="email@example.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink-700">Registered Phone</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-sm text-ink-500 font-mono">
                  <Phone className="h-4 w-4 text-ink-400" />
                  <span>{profile.user.phone}</span>
                  <span className="ml-auto text-2xs uppercase font-bold text-ink-400">Fixed</span>
                </div>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-danger-50 border border-danger-200 text-xs text-danger-700">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-ink-600 hover:bg-ink-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  isLoading={p.isUpdatingProfile}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </SidebarLayout>
  );
}

function DetailRow({ icon, label, value }: { icon: JSX.Element; label: string; value: string }): JSX.Element {
  return (
    <li className="flex items-start gap-3 pt-3 first:pt-0">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink-800 mt-0.5 break-words">{value}</p>
      </div>
    </li>
  );
}
