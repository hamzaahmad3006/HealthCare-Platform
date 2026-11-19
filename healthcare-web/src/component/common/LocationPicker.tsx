import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, Search, Navigation, Layers, ExternalLink } from 'lucide-react';

// Fix Leaflet's default marker icons under Vite/Webpack bundling.
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

// Default to Faisalabad HQ (primary operational city), with quick lookup for
// other major Pakistani cities when selected in the address form.
const FAISALABAD_CENTER: [number, number] = [31.4504, 73.135];

const PAKISTAN_CITY_CENTERS: Record<string, [number, number]> = {
  faisalabad: [31.4504, 73.135],
  lahore: [31.5204, 74.3587],
  karachi: [24.8607, 67.0011],
  islamabad: [33.6844, 73.0479],
  rawalpindi: [33.5651, 73.0169],
  multan: [30.1575, 71.5249],
  gujranwala: [32.1877, 74.1945],
  sialkot: [32.4945, 74.5229],
  peshawar: [34.0151, 71.5249],
};

export interface LocationPickerValue {
  lat: number;
  lng: number;
  resolvedAddress?: string;
  area?: string;
  street?: string;
  postalCode?: string;
  cityName?: string;
}

interface SearchCandidate {
  lat: number;
  lng: number;
  label: string;
  area?: string;
  street?: string;
  postalCode?: string;
  cityName?: string;
}

interface LocationPickerProps {
  value: LocationPickerValue | null;
  onChange: (val: LocationPickerValue) => void;
  height?: string;
  initialCenter?: [number, number];
  cityName?: string;
  autoDetectOnMount?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  height = '340px',
  initialCenter,
  cityName,
  autoDetectOnMount = true,
}: LocationPickerProps): JSX.Element {
  const [resolving, setResolving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);
  const [locatingGps, setLocatingGps] = useState(false);
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'hybrid'>('roadmap');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDetectedRef = useRef(false);

  const cityCenter = useMemo<[number, number]>(() => {
    if (initialCenter) return initialCenter;
    if (cityName) {
      const match = PAKISTAN_CITY_CENTERS[cityName.trim().toLowerCase()];
      if (match) return match;
    }
    return FAISALABAD_CENTER;
  }, [initialCenter, cityName]);

  const center = useMemo<[number, number]>(
    () => (value ? [value.lat, value.lng] : cityCenter),
    [value, cityCenter],
  );

  // Reverse-geocode a pin using ArcGIS World Geocoder + Nominatim fallback
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, signal?: AbortSignal): Promise<void> => {
      setResolving(true);
      try {
        // 1. ArcGIS World Geocoder (fast, reliable in Pakistan, no CORS/UA blocks)
        const arcUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lng},${lat}&langCode=EN`;
        const arcRes = await fetch(arcUrl, { signal });
        if (arcRes.ok) {
          const arcData = (await arcRes.json()) as {
            address?: {
              LongLabel?: string;
              Match_addr?: string;
              Address?: string;
              Neighborhood?: string;
              District?: string;
              City?: string;
              Postal?: string;
            };
          };
          if (arcData.address) {
            const a = arcData.address;
            const resolvedAddress = a.LongLabel || a.Match_addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            const area = a.Neighborhood || a.District || a.Address || undefined;
            const street = a.Address || undefined;
            const postalCode = a.Postal || undefined;
            const resolvedCity = a.City || undefined;

            onChange({
              lat,
              lng,
              resolvedAddress,
              area,
              street,
              postalCode,
              cityName: resolvedCity,
            });
            setResolving(false);
            return;
          }
        }
      } catch {
        // Fall through to Nominatim
      }

      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { signal, headers: { 'Accept-Language': 'en' } },
        );
        if (nomRes.ok) {
          const nomData = (await nomRes.json()) as {
            display_name?: string;
            address?: {
              suburb?: string;
              neighbourhood?: string;
              quarter?: string;
              village?: string;
              town?: string;
              road?: string;
              postcode?: string;
              city?: string;
            };
          };
          if (nomData?.display_name) {
            const addr = nomData.address ?? {};
            onChange({
              lat,
              lng,
              resolvedAddress: nomData.display_name,
              area:
                addr.neighbourhood ||
                addr.suburb ||
                addr.quarter ||
                addr.village ||
                addr.town ||
                undefined,
              street: addr.road || undefined,
              postalCode: addr.postcode || undefined,
              cityName: addr.city || undefined,
            });
          }
        }
      } catch {
        // Ignore abort / network errors
      } finally {
        setResolving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Detect user's real GPS location via browser geolocation API (with Wi-Fi & IP fallbacks)
  const detectCurrentLocation = useCallback(
    (silent = false): void => {
      setLocatingGps(true);
      if (!silent) setSearchError(null);

      const applyCoordinates = (lat: number, lng: number): void => {
        setLocatingGps(false);
        setCandidates([]);
        onChange({ lat, lng, resolvedAddress: 'Detecting address from your location…' });
        void reverseGeocode(lat, lng);
      };

      const fallbackToIpGeo = async (permissionDenied: boolean): Promise<void> => {
        try {
          const res = await fetch('https://ipwho.is/');
          if (res.ok) {
            const data = (await res.json()) as { success?: boolean; latitude?: number; longitude?: number };
            if (data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
              applyCoordinates(data.latitude, data.longitude);
              return;
            }
          }
        } catch {
          // try secondary IP geo endpoint
        }
        try {
          const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
          if (res.ok) {
            const data = (await res.json()) as { latitude?: string; longitude?: string };
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              applyCoordinates(lat, lng);
              return;
            }
          }
        } catch {
          // ignore
        }

        setLocatingGps(false);
        if (!silent) {
          if (permissionDenied) {
            setSearchError(
              'Location permission denied. Please allow location access in your browser address bar, or search your area above.',
            );
          } else {
            setSearchError('Could not detect GPS signal. You can search your area or tap on the map.');
          }
        }
      };

      if (!('geolocation' in navigator)) {
        void fallbackToIpGeo(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoordinates(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          // Retry with low-accuracy (Wi-Fi / network location) before falling back to IP location
          navigator.geolocation.getCurrentPosition(
            (pos2) => applyCoordinates(pos2.coords.latitude, pos2.coords.longitude),
            () => {
              void fallbackToIpGeo(err.code === err.PERMISSION_DENIED);
            },
            {
              enableHighAccuracy: false,
              timeout: 6000,
              maximumAge: 600_000,
            },
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60_000,
        },
      );
    },
    [onChange, reverseGeocode],
  );

  // Auto-detect real location once when modal opens if no coordinates are set yet
  useEffect(() => {
    if (!autoDetectOnMount || value || autoDetectedRef.current) return;
    autoDetectedRef.current = true;
    detectCurrentLocation(true);
  }, [autoDetectOnMount, value, detectCurrentLocation]);

  // Reverse-geocode when user drops or drags pin manually (if resolvedAddress is not already set)
  useEffect(() => {
    if (!value || value.resolvedAddress) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const controller = new AbortController();
    debounceRef.current = setTimeout(() => {
      void reverseGeocode(value.lat, value.lng, controller.signal);
    }, 450);
    return () => {
      controller.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value?.lat, value?.lng, value?.resolvedAddress, reverseGeocode]);

  // Search Pakistan locations via ArcGIS World Geocoder + Nominatim fallback
  const runSearch = async (): Promise<void> => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return;
    setSearchBusy(true);
    setSearchError(null);
    setCandidates([]);

    const targetCity = cityName?.trim() || 'Faisalabad';
    const [biasLat, biasLng] = cityCenter;

    try {
      // Query ArcGIS World Geocoder with Pakistan country filter + city location bias
      const queryWithCity =
        rawQuery.toLowerCase().includes(targetCity.toLowerCase()) ||
        rawQuery.toLowerCase().includes('pakistan')
          ? rawQuery
          : `${rawQuery}, ${targetCity}, Pakistan`;

      const [resBiased, resRaw] = await Promise.all([
        fetch(
          `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(
            queryWithCity,
          )}&countryCode=PAK&location=${biasLng},${biasLat}&maxLocations=6&outFields=Match_addr,Place_addr,StAddr,Neighborhood,District,City,Postal,PlaceName`,
        ),
        fetch(
          `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&SingleLine=${encodeURIComponent(
            rawQuery,
          )}&countryCode=PAK&location=${biasLng},${biasLat}&maxLocations=6&outFields=Match_addr,Place_addr,StAddr,Neighborhood,District,City,Postal,PlaceName`,
        ),
      ]);

      type ArcCandidate = {
        address?: string;
        score?: number;
        location?: { x: number; y: number };
        attributes?: {
          Match_addr?: string;
          Place_addr?: string;
          PlaceName?: string;
          StAddr?: string;
          Neighborhood?: string;
          District?: string;
          City?: string;
          Postal?: string;
        };
      };

      const dataBiased = resBiased.ok
        ? ((await resBiased.json()) as { candidates?: ArcCandidate[] })
        : { candidates: [] };
      const dataRaw = resRaw.ok
        ? ((await resRaw.json()) as { candidates?: ArcCandidate[] })
        : { candidates: [] };

      const combined = [...(dataRaw.candidates ?? []), ...(dataBiased.candidates ?? [])];
      const seen = new Set<string>();
      const results: SearchCandidate[] = [];

      for (const c of combined) {
        if (!c.location) continue;
        const lat = c.location.y;
        const lng = c.location.x;
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const attr = c.attributes ?? {};
        const label =
          attr.Place_addr ||
          attr.Match_addr ||
          c.address ||
          `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const firstPart = label.split(',')[0]?.trim();

        results.push({
          lat,
          lng,
          label,
          area: attr.Neighborhood || attr.District || attr.PlaceName || firstPart || undefined,
          street: attr.StAddr || undefined,
          postalCode: attr.Postal || undefined,
          cityName: attr.City || undefined,
        });
      }

      if (results.length > 0) {
        const best = results[0];
        onChange({
          lat: best.lat,
          lng: best.lng,
          resolvedAddress: best.label,
          area: best.area,
          street: best.street,
          postalCode: best.postalCode,
          cityName: best.cityName,
        });
        if (results.length > 1) {
          setCandidates(results.slice(0, 5));
        }
        return;
      }

      // Fallback to Nominatim if ArcGIS returned nothing
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          rawQuery,
        )}&limit=5&countrycodes=pk&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      if (nomRes.ok) {
        const nomData = (await nomRes.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;
        if (nomData.length > 0) {
          const hit = nomData[0];
          const firstPart = hit.display_name.split(',')[0]?.trim();
          onChange({
            lat: parseFloat(hit.lat),
            lng: parseFloat(hit.lon),
            resolvedAddress: hit.display_name,
            area: firstPart,
          });
          return;
        }
      }

      setSearchError(
        'Location not found — try adding your city name (e.g. "Boley di jhuggi, Faisalabad") or tap "My Location" / drag the pin on the Google Map.',
      );
    } catch {
      setSearchError('Search failed. Tap "My Location" or click directly on the Google Map.');
    } finally {
      setSearchBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search + Real GPS Detect Bar */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
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
            placeholder="Search area, mohalla, landmark, or street on Google Maps…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-white"
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={searchBusy || !searchQuery.trim()}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-brand-700 transition-colors flex items-center gap-1.5"
        >
          {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find'}
        </button>
        <button
          type="button"
          onClick={() => detectCurrentLocation(false)}
          disabled={locatingGps}
          title="Detect my real GPS location"
          className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          {locatingGps ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
          ) : (
            <Navigation className="h-3.5 w-3.5 text-emerald-700" />
          )}
          <span>{locatingGps ? 'Detecting GPS…' : 'My Location'}</span>
        </button>
      </div>

      {/* Candidate suggestions dropdown when multiple places match */}
      {candidates.length > 1 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm divide-y divide-ink-100 overflow-hidden text-xs">
          <div className="px-3 py-1.5 bg-ink-50 text-2xs font-semibold text-ink-500 flex items-center justify-between">
            <span>Matching locations in Pakistan (click to select)</span>
            <button
              type="button"
              onClick={() => setCandidates([])}
              className="text-ink-400 hover:text-ink-700"
            >
              Hide
            </button>
          </div>
          {candidates.map((c, idx) => (
            <button
              key={`${c.lat}-${c.lng}-${idx}`}
              type="button"
              onClick={() => {
                onChange({
                  lat: c.lat,
                  lng: c.lng,
                  resolvedAddress: c.label,
                  area: c.area,
                  street: c.street,
                  postalCode: c.postalCode,
                  cityName: c.cityName,
                });
                setCandidates([]);
              }}
              className="w-full px-3 py-2 text-left hover:bg-brand-50/60 flex items-center gap-2 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" />
              <span className="truncate text-ink-800 font-medium">{c.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {searchError ? <p className="text-xs text-warning-700">{searchError}</p> : null}

      {/* Real Google Map Container */}
      <div
        className="rounded-xl overflow-hidden ring-1 ring-ink-200 relative bg-ink-100"
        style={{ height }}
      >
        {/* Floating Google Map Layer Switcher (Streets vs Satellite Hybrid) */}
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapLayer((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="px-2.5 py-1.5 rounded-lg bg-white/95 backdrop-blur shadow-md ring-1 ring-ink-200 text-xs font-semibold text-ink-800 hover:bg-ink-50 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-brand-600" />
            <span>{mapLayer === 'roadmap' ? 'Satellite' : 'Map View'}</span>
          </button>
        </div>

        <MapContainer
          center={center}
          zoom={value ? 16 : 13}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          {/* Real Google Maps Tile Layer (Roadmap or Satellite Hybrid) */}
          {mapLayer === 'roadmap' ? (
            <TileLayer
              key="google-roadmap"
              attribution="&copy; Google Maps"
              url="https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
              subdomains={['0', '1', '2', '3']}
              maxZoom={20}
            />
          ) : (
            <TileLayer
              key="google-hybrid"
              attribution="&copy; Google Maps Satellite"
              url="https://mt{s}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
              subdomains={['0', '1', '2', '3']}
              maxZoom={20}
            />
          )}

          <MapResizeFix />
          <RecenterOn lat={center[0]} lng={center[1]} hasPin={Boolean(value)} />
          <MapEvents
            onPick={(lat, lng) => {
              setCandidates([]);
              onChange({ lat, lng });
            }}
          />

          {value ? (
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
          ) : null}
        </MapContainer>
      </div>

      {/* Selected Pin Summary + Direct Open in Google Maps link */}
      {value ? (
        <div className="flex items-start justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 ring-1 ring-emerald-200/80 text-xs">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <MapPin className="h-4 w-4 text-emerald-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-950">Pinned Location</span>
                <span className="font-mono text-2xs text-emerald-700">
                  ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
                </span>
              </div>
              {resolving ? (
                <p className="text-emerald-700 italic mt-0.5 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Detecting exact street address…
                </p>
              ) : value.resolvedAddress ? (
                <p className="text-emerald-900 mt-0.5 line-clamp-2">{value.resolvedAddress}</p>
              ) : null}
            </div>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100 text-2xs font-semibold shrink-0 transition-colors"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <p className="text-xs text-ink-500 italic">
          Click <strong>My Location</strong> to detect your real GPS position, search your mohalla/area above, or tap directly on the Google Map to drop a pin.
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

// Ensures Leaflet recalculates container bounds when mounted inside an animated Dialog modal.
function MapResizeFix(): null {
  const map = useMap();
  useEffect(() => {
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 450),
    ];
    let observer: ResizeObserver | null = null;
    const container = map.getContainer();
    if (typeof ResizeObserver !== 'undefined' && container) {
      observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
    }
    return () => {
      timers.forEach((t) => clearTimeout(t));
      observer?.disconnect();
    };
  }, [map]);
  return null;
}

function RecenterOn({
  lat,
  lng,
  hasPin,
}: {
  lat: number;
  lng: number;
  hasPin: boolean;
}): null {
  const map = useMap();
  const lastRef = useRef<{ lat: number; lng: number; hasPin: boolean } | null>(null);
  useEffect(() => {
    const last = lastRef.current;
    if (
      !last ||
      last.hasPin !== hasPin ||
      Math.abs(last.lat - lat) > 0.0003 ||
      Math.abs(last.lng - lng) > 0.0003
    ) {
      const targetZoom = hasPin ? Math.max(map.getZoom(), 16) : 13;
      map.invalidateSize();
      map.setView([lat, lng], targetZoom, { animate: true });
      lastRef.current = { lat, lng, hasPin };
    }
  }, [lat, lng, hasPin, map]);
  return null;
}
