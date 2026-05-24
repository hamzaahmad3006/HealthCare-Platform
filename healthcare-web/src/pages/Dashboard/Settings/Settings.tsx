import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Settings as SettingsIcon, Package, MapPin, ChevronDown, ChevronRight,
  Tag,
} from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { Card } from '../../../constant/Card';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface Package {
  id: string;
  serviceTypeId: string;
  name: string;
  packageType: 'PER_VISIT' | 'WEEKLY' | 'MONTHLY';
  durationDays: number;
  visitCount: number;
  priceAmount: number;
  currency: string;
  description: string | null;
  isActive: boolean;
  serviceType?: { name: string; code: string };
}

interface Zone {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface City {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  zones: Zone[];
}

// ── Tab definition ────────────────────────────────────────────────────────────

type Tab = 'service-types' | 'packages' | 'cities';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'service-types', label: 'Service Types', icon: Tag },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'cities', label: 'Cities & Zones', icon: MapPin },
];

// ── Modal helpers ─────────────────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 p-6">
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none';
const btnPrimary = 'px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50';
const btnGhost = 'px-4 py-2 text-sm font-semibold text-ink-700 rounded-xl hover:bg-ink-100 transition-colors';

// ── Service Types Tab ─────────────────────────────────────────────────────────

function ServiceTypesTab(): JSX.Element {
  const [items, setItems] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '', isActive: true });

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ data: ServiceType[] }>(API.ADMIN.SETTINGS.SERVICE_TYPES)
      .then(({ data }) => setItems(data.data))
      .catch((e) => toast.error(extractApiError(e).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = (): void => {
    setEditing(null);
    setForm({ code: '', name: '', description: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (item: ServiceType): void => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, description: item.description ?? '', isActive: item.isActive });
    setShowForm(true);
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const payload = { ...form, description: form.description || undefined };
      if (editing) {
        await api.patch(API.ADMIN.SETTINGS.SERVICE_TYPE_BY_ID(editing.id), payload);
        toast.success('Service type updated');
      } else {
        await api.post(API.ADMIN.SETTINGS.SERVICE_TYPES, payload);
        toast.success('Service type created');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ServiceType): Promise<void> => {
    try {
      await api.patch(API.ADMIN.SETTINGS.SERVICE_TYPE_BY_ID(item.id), { isActive: !item.isActive });
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-500">{items.length} service type{items.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className={btnPrimary + ' flex items-center gap-1.5'}>
          <Plus className="h-4 w-4" /> Add Service Type
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-ink-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ink-400 text-sm">No service types yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-ink-100 bg-white hover:border-ink-200 transition-colors">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-brand-50 text-brand-700">{item.code}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                {item.description ? <p className="text-xs text-ink-400 truncate">{item.description}</p> : null}
              </div>
              <button onClick={() => toggleActive(item)} className="text-ink-400 hover:text-brand-600 transition-colors" title={item.isActive ? 'Deactivate' : 'Activate'}>
                {item.isActive ? <ToggleRight className="h-5 w-5 text-success-500" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <h3 className="text-base font-bold text-ink-900 mb-4">{editing ? 'Edit Service Type' : 'New Service Type'}</h3>
          <div className="space-y-3">
            <FieldRow label="Code (auto-uppercased)">
              <input className={inputCls} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. NURSING" />
            </FieldRow>
            <FieldRow label="Name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Nursing Care" />
            </FieldRow>
            <FieldRow label="Description (optional)">
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description…" />
            </FieldRow>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

// ── Packages Tab ──────────────────────────────────────────────────────────────

const PKG_TYPE_LABELS: Record<string, string> = {
  PER_VISIT: 'Per Visit',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

function PackagesTab(): JSX.Element {
  const [items, setItems] = useState<Package[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Package | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterSvcType, setFilterSvcType] = useState('');
  const [form, setForm] = useState({
    serviceTypeId: '',
    name: '',
    packageType: 'PER_VISIT' as 'PER_VISIT' | 'WEEKLY' | 'MONTHLY',
    durationDays: '1',
    visitCount: '1',
    priceAmount: '',
    currency: 'PKR',
    description: '',
    isActive: true,
  });

  const load = useCallback(() => {
    setLoading(true);
    const params = filterSvcType ? `?serviceTypeId=${filterSvcType}` : '';
    Promise.all([
      api.get<{ data: Package[] }>(`${API.ADMIN.SETTINGS.PACKAGES}${params}`),
      api.get<{ data: ServiceType[] }>(API.ADMIN.SETTINGS.SERVICE_TYPES),
    ])
      .then(([pkgRes, stRes]) => {
        setItems(pkgRes.data.data);
        setServiceTypes(stRes.data.data);
      })
      .catch((e) => toast.error(extractApiError(e).message))
      .finally(() => setLoading(false));
  }, [filterSvcType]);

  useEffect(() => { load(); }, [load]);

  const openCreate = (): void => {
    setEditing(null);
    setForm({ serviceTypeId: serviceTypes[0]?.id ?? '', name: '', packageType: 'PER_VISIT', durationDays: '1', visitCount: '1', priceAmount: '', currency: 'PKR', description: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (item: Package): void => {
    setEditing(item);
    setForm({
      serviceTypeId: item.serviceTypeId,
      name: item.name,
      packageType: item.packageType,
      durationDays: String(item.durationDays),
      visitCount: String(item.visitCount),
      priceAmount: String(item.priceAmount),
      currency: item.currency,
      description: item.description ?? '',
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        durationDays: Number(form.durationDays),
        visitCount: Number(form.visitCount),
        priceAmount: Number(form.priceAmount),
        description: form.description || undefined,
      };
      if (editing) {
        await api.patch(API.ADMIN.SETTINGS.PACKAGE_BY_ID(editing.id), payload);
        toast.success('Package updated');
      } else {
        await api.post(API.ADMIN.SETTINGS.PACKAGES, payload);
        toast.success('Package created');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Package): Promise<void> => {
    if (!confirm(`Remove package "${item.name}"?`)) return;
    try {
      await api.delete(API.ADMIN.SETTINGS.PACKAGE_BY_ID(item.id));
      toast.success('Package removed');
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          className={inputCls + ' flex-1 max-w-xs'}
          value={filterSvcType}
          onChange={(e) => { setFilterSvcType(e.target.value); }}
        >
          <option value="">All service types</option>
          {serviceTypes.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={openCreate} className={btnPrimary + ' flex items-center gap-1.5'}>
          <Plus className="h-4 w-4" /> Add Package
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-ink-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-ink-400 text-sm">No packages yet.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-colors ${item.isActive ? 'border-ink-100 hover:border-ink-200' : 'border-ink-100 opacity-60'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                  <span className="text-2xs px-1.5 py-0.5 rounded-md bg-ink-100 text-ink-500 font-medium">{PKG_TYPE_LABELS[item.packageType]}</span>
                  {item.serviceType ? <span className="text-2xs px-1.5 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium">{item.serviceType.name}</span> : null}
                  {!item.isActive ? <span className="text-2xs px-1.5 py-0.5 rounded-md bg-danger-50 text-danger-600 font-medium">Inactive</span> : null}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  {item.visitCount} visit{item.visitCount !== 1 ? 's' : ''} · {item.durationDays} day{item.durationDays !== 1 ? 's' : ''} · <span className="font-semibold text-ink-700">{item.currency} {item.priceAmount.toLocaleString()}</span>
                </p>
              </div>
              <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(item)} className="p-1.5 rounded-lg text-ink-400 hover:bg-danger-50 hover:text-danger-600 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <ModalOverlay onClose={() => setShowForm(false)}>
          <h3 className="text-base font-bold text-ink-900 mb-4">{editing ? 'Edit Package' : 'New Package'}</h3>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <FieldRow label="Service Type">
              <select className={inputCls} value={form.serviceTypeId} onChange={(e) => setForm((p) => ({ ...p, serviceTypeId: e.target.value }))}>
                {serviceTypes.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Package Name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Weekly Nursing Plan" />
            </FieldRow>
            <FieldRow label="Package Type">
              <select className={inputCls} value={form.packageType} onChange={(e) => setForm((p) => ({ ...p, packageType: e.target.value as 'PER_VISIT' | 'WEEKLY' | 'MONTHLY' }))}>
                <option value="PER_VISIT">Per Visit</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Duration (days)">
                <input type="number" className={inputCls} value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))} min="1" />
              </FieldRow>
              <FieldRow label="Visit Count">
                <input type="number" className={inputCls} value={form.visitCount} onChange={(e) => setForm((p) => ({ ...p, visitCount: e.target.value }))} min="1" />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Price">
                <input type="number" className={inputCls} value={form.priceAmount} onChange={(e) => setForm((p) => ({ ...p, priceAmount: e.target.value }))} placeholder="0" min="0" />
              </FieldRow>
              <FieldRow label="Currency">
                <input className={inputCls} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} maxLength={3} />
              </FieldRow>
            </div>
            <FieldRow label="Description (optional)">
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </FieldRow>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

// ── Cities & Zones Tab ────────────────────────────────────────────────────────

function CitiesTab(): JSX.Element {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [cityForm, setCityForm] = useState({ name: '', slug: '', isActive: true });
  const [savingCity, setSavingCity] = useState(false);

  const [editingZone, setEditingZone] = useState<{ zone: Zone; cityId: string } | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', slug: '', isActive: true, cityId: '' });
  const [savingZone, setSavingZone] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ data: City[] }>(API.ADMIN.SETTINGS.CITIES)
      .then(({ data }) => setCities(data.data))
      .catch((e) => toast.error(extractApiError(e).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // City form
  const openCreateCity = (): void => {
    setEditingCity(null);
    setCityForm({ name: '', slug: '', isActive: true });
    setShowCityForm(true);
  };
  const openEditCity = (city: City): void => {
    setEditingCity(city);
    setCityForm({ name: city.name, slug: city.slug, isActive: city.isActive });
    setShowCityForm(true);
  };
  const saveCity = async (): Promise<void> => {
    setSavingCity(true);
    try {
      if (editingCity) {
        await api.patch(API.ADMIN.SETTINGS.CITY_BY_ID(editingCity.id), cityForm);
        toast.success('City updated');
      } else {
        await api.post(API.ADMIN.SETTINGS.CITIES, cityForm);
        toast.success('City created');
      }
      setShowCityForm(false);
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    } finally {
      setSavingCity(false);
    }
  };

  // Zone form
  const openCreateZone = (cityId: string): void => {
    setEditingZone(null);
    setZoneForm({ name: '', slug: '', isActive: true, cityId });
    setShowZoneForm(true);
  };
  const openEditZone = (zone: Zone, cityId: string): void => {
    setEditingZone({ zone, cityId });
    setZoneForm({ name: zone.name, slug: zone.slug, isActive: zone.isActive, cityId });
    setShowZoneForm(true);
  };
  const saveZone = async (): Promise<void> => {
    setSavingZone(true);
    const { cityId, ...payload } = zoneForm;
    try {
      if (editingZone) {
        await api.patch(API.ADMIN.SETTINGS.ZONE_BY_ID(cityId, editingZone.zone.id), payload);
        toast.success('Zone updated');
      } else {
        await api.post(API.ADMIN.SETTINGS.ZONES(cityId), payload);
        toast.success('Zone created');
      }
      setShowZoneForm(false);
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    } finally {
      setSavingZone(false);
    }
  };
  const deleteZone = async (cityId: string, zone: Zone): Promise<void> => {
    if (!confirm(`Remove zone "${zone.name}"?`)) return;
    try {
      await api.delete(API.ADMIN.SETTINGS.ZONE_BY_ID(cityId, zone.id));
      toast.success('Zone removed');
      load();
    } catch (e) {
      toast.error(extractApiError(e).message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-500">{cities.length} cit{cities.length !== 1 ? 'ies' : 'y'}</p>
        <button onClick={openCreateCity} className={btnPrimary + ' flex items-center gap-1.5'}>
          <Plus className="h-4 w-4" /> Add City
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-ink-100 animate-pulse" />)}
        </div>
      ) : cities.length === 0 ? (
        <div className="text-center py-12 text-ink-400 text-sm">No cities yet.</div>
      ) : (
        <div className="space-y-2">
          {cities.map((city) => (
            <div key={city.id} className="rounded-xl border border-ink-100 bg-white overflow-hidden">
              {/* City row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={() => toggleExpand(city.id)} className="text-ink-400 hover:text-ink-700 transition-colors">
                  {expanded.has(city.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{city.name}</p>
                  <p className="text-xs text-ink-400">{city.zones.length} zone{city.zones.length !== 1 ? 's' : ''}</p>
                </div>
                {!city.isActive ? <span className="text-2xs px-1.5 py-0.5 rounded-md bg-danger-50 text-danger-600 font-medium">Inactive</span> : null}
                <button onClick={() => openEditCity(city)} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => { openCreateZone(city.id); setExpanded((p) => new Set([...p, city.id])); }} className="p-1.5 rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors" title="Add zone">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Zones */}
              {expanded.has(city.id) ? (
                <div className="border-t border-ink-50 px-4 py-2 space-y-1">
                  {city.zones.length === 0 ? (
                    <p className="text-xs text-ink-400 py-2">No zones. Click + to add one.</p>
                  ) : city.zones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2 py-1.5 pl-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                      <p className="text-sm text-ink-700 flex-1">{zone.name}</p>
                      {!zone.isActive ? <span className="text-2xs px-1.5 py-0.5 rounded-md bg-danger-50 text-danger-600 font-medium">Inactive</span> : null}
                      <button onClick={() => openEditZone(zone, city.id)} className="p-1 rounded-lg text-ink-300 hover:bg-ink-100 hover:text-ink-600 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteZone(city.id, zone)} className="p-1 rounded-lg text-ink-300 hover:bg-danger-50 hover:text-danger-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* City form modal */}
      {showCityForm ? (
        <ModalOverlay onClose={() => setShowCityForm(false)}>
          <h3 className="text-base font-bold text-ink-900 mb-4">{editingCity ? 'Edit City' : 'New City'}</h3>
          <div className="space-y-3">
            <FieldRow label="City Name">
              <input className={inputCls} value={cityForm.name} onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Faisalabad" />
            </FieldRow>
            <FieldRow label="Slug">
              <input className={inputCls} value={cityForm.slug} onChange={(e) => setCityForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. faisalabad" />
            </FieldRow>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={cityForm.isActive} onChange={(e) => setCityForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button className={btnGhost} onClick={() => setShowCityForm(false)}>Cancel</button>
            <button className={btnPrimary} onClick={saveCity} disabled={savingCity}>{savingCity ? 'Saving…' : 'Save'}</button>
          </div>
        </ModalOverlay>
      ) : null}

      {/* Zone form modal */}
      {showZoneForm ? (
        <ModalOverlay onClose={() => setShowZoneForm(false)}>
          <h3 className="text-base font-bold text-ink-900 mb-4">{editingZone ? 'Edit Zone' : 'New Zone'}</h3>
          <div className="space-y-3">
            <FieldRow label="Zone Name">
              <input className={inputCls} value={zoneForm.name} onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Gulberg" />
            </FieldRow>
            <FieldRow label="Slug">
              <input className={inputCls} value={zoneForm.slug} onChange={(e) => setZoneForm((p) => ({ ...p, slug: e.target.value }))} placeholder="e.g. gulberg" />
            </FieldRow>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input type="checkbox" checked={zoneForm.isActive} onChange={(e) => setZoneForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-5">
            <button className={btnGhost} onClick={() => setShowZoneForm(false)}>Cancel</button>
            <button className={btnPrimary} onClick={saveZone} disabled={savingZone}>{savingZone ? 'Saving…' : 'Save'}</button>
          </div>
        </ModalOverlay>
      ) : null}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export function Settings(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('service-types');

  return (
    <SidebarLayout title="Settings" description="Manage service types, packages, and locations">
      <Card padding="none" className="overflow-hidden animate-slide-up">
        {/* Tabs */}
        <div className="flex border-b border-ink-100 px-2 pt-2 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-700 bg-brand-50 border-b-2 border-brand-600 -mb-px'
                  : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'service-types' ? <ServiceTypesTab /> : null}
          {activeTab === 'packages' ? <PackagesTab /> : null}
          {activeTab === 'cities' ? <CitiesTab /> : null}
        </div>
      </Card>
    </SidebarLayout>
  );
}
