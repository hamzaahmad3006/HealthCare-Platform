import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, Search } from 'lucide-react';

// Fix Leaflet's default marker icons under Vite/Webpack bundling — the library
// references icon images by relative URL that don't exist after bundling. We
// point them at the CDN copies so the default <Marker /> renders correctly.
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const KARACHI_CENTER: [number, number] = [24.8607, 67.0011];

export interface LocationPickerValue {
  lat: number;
  lng: number;
  resolvedAddress?: string;
}

interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (val: LocationPickerValue) => void;
  height?: string;
  initialCenter?: [number, number];
}

export function LocationPicker({
  value,
  onChange,
  height = '320px',
  initialCenter = KARACHI_CENTER,
}: LocationPickerProps): JSX.Element {
  const [resolving, setResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const center = useMemo<[number, number]>(
    () => (value ? [value.lat, value.lng] : initialCenter),
    [value, initialCenter],
  );

  // Reverse-geocode current pin via Nominatim (debounced) to show a human-readable address.
  useEffect(() => {
    if (!value) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      setResolving(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${value.lat}&lon=${value.lng}&zoom=18&addressdetails=1`,
        { signal: controller.signal, headers: { 'Accept-Language': 'en' } },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { display_name?: string } | null) => {
          if (data?.display_name) {
            onChange({ lat: value.lat, lng: value.lng, resolvedAddress: data.display_name });
          }
        })
        .catch(() => undefined)
        .finally(() => setResolving(false));
      return () => controller.abort();
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // We intentionally exclude onChange from deps — it's a fresh closure on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  const runSearch = async (): Promise<void> => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchBusy(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=pk`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (data.length === 0) {
        setSearchError('No results — try drag the pin on the map instead.');
      } else {
        const hit = data[0];
        onChange({
          lat: parseFloat(hit.lat),
          lng: parseFloat(hit.lon),
          resolvedAddress: hit.display_name,
        });
      }
    } catch {
      setSearchError('Search failed. Drag the pin on the map instead.');
    } finally {
      setSearchBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Search for an area, landmark, or street…"
            className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={searchBusy || !searchQuery.trim()}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-brand-700 transition-colors"
        >
          {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
        </button>
      </div>
      {searchError ? <p className="text-xs text-warning-700">{searchError}</p> : null}

      <div
        className="rounded-xl overflow-hidden ring-1 ring-ink-200 relative"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={value ? 15 : 11}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
          />
          <MapEvents onPick={(lat, lng) => onChange({ lat, lng })} />
          {value ? (
            <>
              <RecenterOn lat={value.lat} lng={value.lng} />
              <Marker
                position={[value.lat, value.lng]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as L.Marker;
                    const { lat, lng } = m.getLatLng();
                    onChange({ lat, lng });
                  },
                }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>

      {value ? (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-brand-50/60 ring-1 ring-brand-200/40 text-xs">
          <MapPin className="h-3.5 w-3.5 text-brand-700 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-ink-700">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
            {resolving ? (
              <p className="text-ink-500 italic mt-0.5 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Resolving address…
              </p>
            ) : value.resolvedAddress ? (
              <p className="text-ink-600 mt-0.5 line-clamp-2">{value.resolvedAddress}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-500 italic">
          Tap the map (or search above) to drop a pin. Drag the pin to fine-tune.
        </p>
      )}
    </div>
  );
}

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }): null {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOn({ lat, lng }: { lat: number; lng: number }): null {
  const map = useMap();
  const lastRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    const last = lastRef.current;
    if (!last || Math.abs(last.lat - lat) > 0.0005 || Math.abs(last.lng - lng) > 0.0005) {
      map.setView([lat, lng], map.getZoom() < 13 ? 15 : map.getZoom());
      lastRef.current = { lat, lng };
    }
  }, [lat, lng, map]);
  return null;
}
