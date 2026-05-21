import { useRef } from 'react';
import { Phone, Mail, MapPin, BadgeCheck, Briefcase, Camera, User as UserIcon, Loader2 } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { LoadingSpinner } from '../../../component/common/LoadingSpinner';
import { StatusBadge } from '../../../component/common/StatusBadge';
import { Card } from '../../../constant/Card';
import { Badge } from '../../../constant/Badge';
import { formatDate } from '../../../helper/format';
import { useStaffProfile } from './useStaffProfile';

export function StaffProfile(): JSX.Element {
  const p = useStaffProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <SidebarLayout title="My Profile" description="Your personal & professional details">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — avatar + identity */}
        <Card padding="md" className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={profile.user.fullName}
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-brand-100"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gradient-brand-soft text-brand-600 flex items-center justify-center ring-2 ring-brand-100">
                  <UserIcon className="h-12 w-12" />
                </div>
              )}
              <button
                onClick={handleFilePick}
                disabled={p.isUploadingAvatar}
                title="Change profile picture"
                className="absolute -bottom-1 -right-1 h-10 w-10 rounded-full bg-brand-600 text-white shadow-brand flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <h2 className="mt-4 text-lg font-bold text-ink-900">{profile.user.fullName}</h2>
            <p className="text-xs text-ink-500 font-mono mt-0.5">{profile.staffCode}</p>

            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <StatusBadge status={profile.verificationStatus} kind="verif" size="sm" />
              {profile.isAvailable ? (
                <Badge tone="brand">Available</Badge>
              ) : (
                <Badge tone="neutral">Unavailable</Badge>
              )}
            </div>

            <p className="text-2xs text-ink-400 mt-3">
              JPEG or PNG · up to 5 MB
            </p>
          </div>
        </Card>

        {/* Right — contact + professional details */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Contact</h3>
            <ul className="space-y-3 text-sm">
              <DetailRow icon={<Phone className="h-4 w-4 text-ink-500" />} label="Phone" value={profile.user.phone} />
              <DetailRow icon={<Mail className="h-4 w-4 text-ink-500" />} label="Email" value={profile.user.email ?? '—'} />
              <DetailRow
                icon={<MapPin className="h-4 w-4 text-ink-500" />}
                label="Location"
                value={
                  profile.city
                    ? profile.zone
                      ? `${profile.zone.name}, ${profile.city.name}`
                      : profile.city.name
                    : '—'
                }
              />
            </ul>
          </Card>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Professional details</h3>
            <ul className="space-y-3 text-sm">
              <DetailRow
                icon={<BadgeCheck className="h-4 w-4 text-ink-500" />}
                label="CNIC"
                value={profile.cnic ?? '—'}
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4 text-ink-500" />}
                label="Gender"
                value={profile.gender ?? '—'}
              />
              <DetailRow
                icon={<UserIcon className="h-4 w-4 text-ink-500" />}
                label="Date of birth"
                value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '—'}
              />
              <DetailRow
                icon={<Briefcase className="h-4 w-4 text-ink-500" />}
                label="Experience"
                value={`${profile.experienceYears} year${profile.experienceYears === 1 ? '' : 's'}`}
              />
              {profile.ambulanceNumber ? (
                <DetailRow
                  icon={<Briefcase className="h-4 w-4 text-ink-500" />}
                  label="Ambulance number"
                  value={profile.ambulanceNumber}
                />
              ) : null}
            </ul>
          </Card>

          <Card padding="md">
            <h3 className="text-sm font-semibold text-ink-800 mb-3">Services offered</h3>
            {profile.serviceTypes.length === 0 ? (
              <p className="text-sm text-ink-400 italic">No services selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.serviceTypes.map((st) => (
                  <Badge key={st.serviceType.id} tone="brand">
                    {st.serviceType.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}

function DetailRow({ icon, label, value }: { icon: JSX.Element; label: string; value: string }): JSX.Element {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <p className="text-sm text-ink-800 mt-0.5 break-words">{value}</p>
      </div>
    </li>
  );
}
