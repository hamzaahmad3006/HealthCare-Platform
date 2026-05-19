import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, BadgeCheck, UserCheck, Phone, MapPin } from 'lucide-react';
import { Button } from '../../constant/Button';
import { Badge } from '../../constant/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import type { StaffWithRelations } from '../../types/staff.types';

interface StaffAssignPanelProps {
  open: boolean;
  onClose: () => void;
  staffList: StaffWithRelations[];
  isLoading: boolean;
  assigningStaffId: string | null;
  onAssign: (staffUserId: string) => Promise<void> | void;
}

export function StaffAssignPanel({
  open,
  onClose,
  staffList,
  isLoading,
  assigningStaffId,
  onAssign,
}: StaffAssignPanelProps): JSX.Element {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 flex justify-end">
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-full max-w-md bg-white shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-ink-100">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-ink-900">
                    Assign Staff
                  </Dialog.Title>
                  <p className="text-sm text-ink-500 mt-0.5">Select a verified, available staff member</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {isLoading ? (
                  <LoadingSpinner label="Loading eligible staff…" className="py-16" />
                ) : staffList.length === 0 ? (
                  <EmptyState
                    icon={<UserCheck className="h-7 w-7" />}
                    title="No eligible staff found"
                    description="Try adjusting filters or onboarding more staff in this city."
                  />
                ) : (
                  <ul className="space-y-3">
                    {staffList.map((staff) => (
                      <li
                        key={staff.userId}
                        className="p-4 rounded-xl ring-1 ring-ink-200 hover:ring-brand-500/40 hover:shadow-card transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-semibold flex-shrink-0">
                            {staff.user.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-ink-900 truncate">{staff.user.fullName}</h4>
                              {staff.verificationStatus === 'VERIFIED' ? (
                                <Badge tone="success" size="sm" leftIcon={<BadgeCheck className="h-3 w-3" />}>
                                  Verified
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-xs font-mono text-ink-500 mt-0.5">{staff.staffCode}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-ink-600">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {staff.user.phone}
                              </span>
                              {staff.city?.name ? (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {staff.city.name}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-ink-500 mt-1">
                              {staff.experienceYears} yrs exp ·{' '}
                              {staff.serviceTypes.map((s) => s.serviceType.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => void onAssign(staff.userId)}
                            isLoading={assigningStaffId === staff.userId}
                          >
                            Assign
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
