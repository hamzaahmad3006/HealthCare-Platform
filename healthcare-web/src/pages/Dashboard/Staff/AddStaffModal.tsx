import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Controller } from 'react-hook-form';
import {
  X,
  UserPlus,
  CheckCircle2,
  Copy,
  Mail,
  MessageCircle,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  UserCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../constant/Button';
import { Input } from '../../../constant/Input';
import { PhoneInput } from '../../../component/common/PhoneInput';
import { useCreateStaff, type CreateStaffSuccess, type CustomerSearchResult } from './useCreateStaff';

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddStaffModal({ open, onClose, onCreated }: AddStaffModalProps): JSX.Element {
  const c = useCreateStaff();
  const { register, handleSubmit, formState, control } = c.form;

  const handleClose = (): void => {
    if (c.result) {
      onCreated();
      c.resetResult();
    }
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-card-hover ring-1 ring-ink-100 overflow-hidden">
                {c.result ? (
                  <SuccessView result={c.result} onClose={handleClose} />
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-gradient-brand-soft">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-sm">
                          {c.activeTab === 'invite' ? (
                            <UserPlus className="h-4 w-4" />
                          ) : (
                            <ArrowRightLeft className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <Dialog.Title className="font-bold text-ink-900">
                            {c.activeTab === 'invite' ? 'Invite New Staff' : 'Promote Customer to Staff'}
                          </Dialog.Title>
                          <p className="text-xs text-ink-600">
                            {c.activeTab === 'invite'
                              ? 'Send onboarding invite with temporary credentials'
                              : 'Convert an already registered customer into staff'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-ink-500 hover:bg-white/60 transition-colors"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-ink-100/70 rounded-xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => c.setActiveTab('invite')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                          c.activeTab === 'invite'
                            ? 'bg-white text-emerald-800 shadow-sm'
                            : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Invite New</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          c.setActiveTab('convert');
                          if (c.customerSearchResults.length === 0) {
                            void c.searchCustomers('');
                          }
                        }}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                          c.activeTab === 'convert'
                            ? 'bg-white text-emerald-800 shadow-sm'
                            : 'text-ink-600 hover:text-ink-900'
                        }`}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>Convert Customer</span>
                      </button>
                    </div>

                    {/* Tab 1: Invite New Staff */}
                    {c.activeTab === 'invite' ? (
                      <>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void handleSubmit(c.onSubmit)();
                          }}
                          className="px-6 py-5 space-y-4"
                        >
                          {/* Alert if customer match was detected on submit */}
                          {c.customerMatch ? (
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                  <UserCheck className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                                      Customer Already Registered
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={c.clearCustomerMatch}
                                      className="text-indigo-400 hover:text-indigo-700"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-sm font-semibold text-ink-900 mt-0.5 truncate">
                                    {c.customerMatch.fullName}
                                  </p>
                                  <p className="text-xs text-ink-600 mt-0.5">
                                    {c.customerMatch.email ?? c.customerMatch.phone} is registered as a Customer. You can promote them directly to Staff.
                                  </p>
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      type="button"
                                      onClick={() => void c.convertCustomer(c.customerMatch!.userId)}
                                      isLoading={c.isSubmitting}
                                      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                                    >
                                      Promote to Staff & Send Invite
                                    </Button>
                                    <Button
                                      size="sm"
                                      type="button"
                                      variant="ghost"
                                      onClick={c.clearCustomerMatch}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <Input
                            label="Full name *"
                            placeholder="Sarah Khan"
                            error={formState.errors.fullName?.message}
                            {...register('fullName')}
                          />

                          <Controller
                            control={control}
                            name="phone"
                            render={({ field }) => (
                              <PhoneInput
                                label="Phone *"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                helperText="Used for login + WhatsApp invite"
                                error={formState.errors.phone?.message}
                              />
                            )}
                          />

                          <Input
                            label="Email *"
                            type="email"
                            placeholder="sarah@example.com"
                            helperText="Invite link with temp password is sent here"
                            error={formState.errors.email?.message}
                            {...register('email')}
                          />

                          <div className="rounded-xl bg-brand-50 ring-1 ring-brand-200/60 px-4 py-3 text-xs text-brand-800 leading-relaxed">
                            <strong>What happens next:</strong> We email them branded login credentials. After first login they fill their CNIC, experience, and upload certification documents.
                          </div>
                        </form>

                        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-ink-100 bg-ink-50">
                          <Button variant="ghost" onClick={onClose} disabled={c.isSubmitting}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => void handleSubmit(c.onSubmit)()}
                            isLoading={c.isSubmitting}
                            leftIcon={<UserPlus className="h-4 w-4" />}
                          >
                            Send invite
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Tab 2: Convert Existing Customer */
                      <ConvertCustomerTab
                        isSearching={c.isSearching}
                        searchQuery={c.customerSearchQuery}
                        onSearchChange={(q) => {
                          c.setCustomerSearchQuery(q);
                          void c.searchCustomers(q);
                        }}
                        customers={c.customerSearchResults}
                        onConvert={(userId) => void c.convertCustomer(userId)}
                        isSubmitting={c.isSubmitting}
                        onClose={onClose}
                      />
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ─── Convert Customer Tab ───────────────────────────────────────────────────

function ConvertCustomerTab({
  isSearching,
  searchQuery,
  onSearchChange,
  customers,
  onConvert,
  isSubmitting,
  onClose,
}: {
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  customers: CustomerSearchResult[];
  onConvert: (userId: string) => void;
  isSubmitting: boolean;
  onClose: () => void;
}): JSX.Element {
  return (
    <div className="p-6">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by customer name, email, or phone…"
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-ink-900 placeholder-ink-400"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {isSearching ? (
          <div className="py-12 text-center text-xs text-ink-500">
            Searching registered customers…
          </div>
        ) : customers.length === 0 ? (
          <div className="py-10 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-ink-100 flex items-center justify-center text-ink-400 mb-2">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-ink-700">No customers found</p>
            <p className="text-2xs text-ink-500 mt-0.5">
              Try searching with another name, phone number, or email.
            </p>
          </div>
        ) : (
          customers.map((cust) => (
            <div
              key={cust.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-ink-100 hover:border-emerald-200 bg-white hover:bg-emerald-50/30 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-brand text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {cust.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-ink-900 truncate">
                    {cust.fullName}
                  </h4>
                  <p className="text-xs text-ink-500 truncate">
                    {cust.email ?? 'No email'} · {cust.phone}
                  </p>
                  <p className="text-2xs text-ink-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(cust.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onConvert(cust.id)}
                isLoading={isSubmitting}
                leftIcon={<Sparkles className="h-3.5 w-3.5 text-emerald-600" />}
              >
                Promote
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-end mt-5 pt-3 border-t border-ink-100">
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
      </div>
    </div>
  );
}

// ─── Success view ───────────────────────────────────────────────────────────

function SuccessView({
  result,
  onClose,
}: {
  result: CreateStaffSuccess;
  onClose: () => void;
}): JSX.Element {
  const copyPassword = async (): Promise<void> => {
    await navigator.clipboard.writeText(result.tempPassword);
    toast.success('Password copied to clipboard');
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-sm">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <Dialog.Title className="font-bold text-ink-900 text-lg">
            {result.isConverted ? 'Customer Upgraded to Staff' : 'Staff Invite Sent'}
          </Dialog.Title>
          <p className="text-sm text-ink-600">
            {result.fullName} · {result.staffCode}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-ink-50 ring-1 ring-ink-100 p-4 mb-4">
        <p className="text-2xs font-mono uppercase tracking-wider text-ink-500 mb-1.5">
          Temporary password
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-ink-900 bg-white rounded-lg ring-1 ring-ink-200 px-3 py-2 text-sm break-all">
            {result.tempPassword}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copyPassword()}
            leftIcon={<Copy className="h-3.5 w-3.5" />}
          >
            Copy
          </Button>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          Shown once. The staff member will be prompted to set a permanent password upon first login.
        </p>
      </div>

      <div className="space-y-2 mb-5">
        <DeliveryRow
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          target={result.phone}
          delivered={result.delivery.whatsapp}
        />
        <DeliveryRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          target={result.email ?? '—'}
          delivered={result.delivery.email}
        />
      </div>

      {!result.delivery.whatsapp && !result.delivery.email ? (
        <div className="flex items-start gap-2 rounded-xl bg-warning-50 ring-1 ring-warning-500/20 px-4 py-3 mb-5">
          <AlertTriangle className="h-4 w-4 text-warning-700 mt-0.5" />
          <div className="text-xs text-warning-700 leading-relaxed">
            <strong>No automated delivery succeeded.</strong> Copy the credentials above and share
            them with the staff member manually.
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

function DeliveryRow({
  icon,
  label,
  target,
  delivered,
}: {
  icon: JSX.Element;
  label: string;
  target: string;
  delivered: boolean;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg ring-1 ring-ink-100 bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-ink-700 min-w-0">
        <span className="text-ink-500">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-ink-500 truncate">— {target}</span>
      </div>
      {delivered ? (
        <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sent
        </span>
      ) : (
        <span className="text-xs font-semibold text-warning-700">Failed</span>
      )}
    </div>
  );
}
