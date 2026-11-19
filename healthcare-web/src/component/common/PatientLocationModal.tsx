import { useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Phone, X, Layers, User, ExternalLink } from 'lucide-react';
import type { VisitAddress } from '../../pages/Dashboard/Visits/useVisits';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function parseCoord(val: number | string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function buildGoogleMapsDirectionsUrl(address?: VisitAddress | null): string | null {
  if (!address) return null;
  const lat = parseCoord(address.latitude);
  const lng = parseCoord(address.longitude);
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  const parts = [address.line1, address.line2, address.area, address.city?.name, 'Pakistan'].filter(Boolean);
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`;
}

export function formatShortAddress(address?: VisitAddress | null): string {
  if (!address) return '';
  return [address.line1, address.area, address.city?.name].filter(Boolean).join(', ');
}

interface PatientLocationModalProps {
  patientName: string;
  bookingNumber?: string;
  address: VisitAddress;
  onClose: () => void;
}

export function PatientLocationModal({
  patientName,
  bookingNumber,
  address,
  onClose,
}: PatientLocationModalProps): JSX.Element {
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'hybrid'>('roadmap');
  const lat = parseCoord(address.latitude);
  const lng = parseCoord(address.longitude);
  const hasCoords = lat !== null && lng !== null;
  const directionsUrl = buildGoogleMapsDirectionsUrl(address);

  const fullAddress = [
    address.line1,
    address.line2,
    address.area,
    address.city?.name,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl ring-1 ring-ink-200 w-full max-w-xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-ink-100 bg-gradient-to-r from-brand-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-900">Patient Visit Location</h2>
              <p className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5">
                <User className="h-3 w-3 text-ink-400" />
                <span className="font-medium text-ink-700">{patientName}</span>
                {bookingNumber ? <span className="font-mono text-ink-400">· {bookingNumber}</span> : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Map View */}
        <div className="relative">
          {hasCoords ? (
            <div className="relative h-72 w-full bg-ink-100">
              <MapContainer
                center={[lat, lng]}
                zoom={16}
                scrollWheelZoom
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution="&copy; Google Maps"
                  url={
                    mapLayer === 'roadmap'
                      ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
                      : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                  }
                  maxZoom={20}
                />
                <Marker position={[lat, lng]} icon={markerIcon} />
              </MapContainer>
              <button
                type="button"
                onClick={() => setMapLayer((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
                className="absolute top-3 right-3 z-[400] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 text-ink-800 text-xs font-semibold shadow-md ring-1 ring-ink-200 hover:bg-white transition-all"
              >
                <Layers className="h-3.5 w-3.5 text-brand-600" />
                {mapLayer === 'roadmap' ? 'Satellite' : 'Map'}
              </button>
              <div className="absolute bottom-3 left-3 z-[400] px-2.5 py-1 rounded-lg bg-ink-900/80 text-white text-[11px] font-mono backdrop-blur-xs">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </div>
            </div>
          ) : (
            <div className="px-6 py-8 bg-amber-50/50 border-b border-amber-100 text-center">
              <MapPin className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-ink-800">GPS pin not saved for this address</p>
              <p className="text-xs text-ink-500 mt-1">
                Use the full street address below or open Google Maps to search the area.
              </p>
            </div>
          )}
        </div>

        {/* Address & Contact Details */}
        <div className="p-6 space-y-4">
          <div className="rounded-2xl bg-ink-50/70 border border-ink-100 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">
                  {address.label ? `${address.label} Address` : 'Service Address'}
                </p>
                <p className="text-sm font-semibold text-ink-900 mt-0.5 leading-snug">
                  {fullAddress || 'Address not provided'}
                </p>
              </div>
            </div>

            {(address.contactName || address.contactPhone) && (
              <div className="pt-2.5 border-t border-ink-200/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs text-ink-600">
                  <span className="text-ink-400">Contact: </span>
                  <span className="font-semibold text-ink-800">
                    {address.contactName ?? patientName}
                  </span>
                  {address.contactPhone ? (
                    <span className="font-mono text-ink-600 ml-1.5">{address.contactPhone}</span>
                  ) : null}
                </div>
                {address.contactPhone ? (
                  <a
                    href={`tel:${address.contactPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call Contact
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink-700 bg-ink-100 rounded-xl hover:bg-ink-200 transition-colors"
            >
              Close
            </button>
            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-sm transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                {hasCoords ? 'Get Directions in Google Maps' : 'Open in Google Maps'}
                <ExternalLink className="h-3 w-3 opacity-80" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
