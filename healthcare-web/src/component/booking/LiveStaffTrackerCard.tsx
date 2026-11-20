import { useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  Phone,
  Clock,
  Layers,
  ExternalLink,
  CheckCircle2,
  Compass,
  Radio,
  Star,
  MessageSquareQuote,
} from 'lucide-react';
import { Card } from '../../constant/Card';
import type { LiveTrackingInfo } from '../../types/booking.types';

const staffPinIcon = L.divIcon({
  className: 'custom-staff-live-marker',
  html: `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:42px;height:42px;">
      <span style="position:absolute;width:42px;height:42px;border-radius:9999px;background:rgba(16,185,129,0.28);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <div style="position:relative;width:34px;height:34px;border-radius:9999px;background:#059669;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:16px;">
        🚑
      </div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const patientHomeIcon = L.divIcon({
  className: 'custom-patient-home-marker',
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#1d4ed8;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.25);font-size:16px;">
      🏠
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface LiveStaffTrackerCardProps {
  tracking: LiveTrackingInfo;
  patientName: string;
  addressLine: string;
}

export function LiveStaffTrackerCard({
  tracking,
  patientName,
  addressLine,
}: LiveStaffTrackerCardProps): JSX.Element {
  const [mapLayer, setMapLayer] = useState<'roadmap' | 'hybrid'>('roadmap');
  const isArrived = tracking.status === 'CHECKED_IN';

  const centerLat = (tracking.staffLatitude + tracking.patientLatitude) / 2;
  const centerLng = (tracking.staffLongitude + tracking.patientLongitude) / 2;

  const googleMapsLiveRouteUrl = `https://www.google.com/maps/dir/?api=1&origin=${tracking.staffLatitude},${tracking.staffLongitude}&destination=${tracking.patientLatitude},${tracking.patientLongitude}&travelmode=driving`;

  return (
    <Card
      variant="elevated"
      padding="none"
      className="mb-6 overflow-hidden border-2 border-brand-500/40 shadow-lg"
    >
      {/* Top Uber-Style Live Telemetry Header */}
      <div
        className={`px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          isArrived
            ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600'
            : 'bg-gradient-to-r from-brand-800 via-brand-700 to-emerald-600'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 ring-1 ring-white/30">
            {isArrived ? (
              <CheckCircle2 className="h-6 w-6 text-white" />
            ) : (
              <Navigation className="h-6 w-6 text-white animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-white text-brand-800 shadow-xs">
                <Radio className="h-3 w-3 text-emerald-600 animate-pulse" />
                {isArrived ? 'Arrived & Checked In' : 'Live Staff GPS Radar'}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Visit #{tracking.sequenceNo} · Auto-updates every 5s
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold mt-1">
              {isArrived
                ? `${tracking.staffName} is at your location`
                : `${tracking.staffName} is on the way to ${patientName}`}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5 flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>{tracking.headingLabel}</span>
            </p>
          </div>
        </div>

        {/* Big ETA & Distance Hero Box */}
        <div className="flex items-center gap-3 bg-ink-950/30 backdrop-blur-xs px-4 py-2.5 rounded-2xl ring-1 ring-white/20 shrink-0">
          <div className="text-center pr-3 border-r border-white/20">
            <p className="text-2xs uppercase tracking-wider text-emerald-200 font-bold">
              {isArrived ? 'Status' : 'Est. Arrival'}
            </p>
            <p className="text-xl font-extrabold text-white flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-emerald-300" />
              {isArrived ? 'On Site' : `${tracking.etaMinutes} min`}
            </p>
          </div>
          <div className="text-center pl-1">
            <p className="text-2xs uppercase tracking-wider text-emerald-200 font-bold">Distance</p>
            <p className="text-xl font-extrabold text-white">
              {isArrived ? '0.0 km' : `${tracking.distanceKm} km`}
            </p>
          </div>
        </div>
      </div>

      {/* Route Progress Bar */}
      <div className="px-6 py-3 bg-brand-50/70 border-b border-brand-100">
        <div className="flex items-center justify-between text-xs font-semibold text-ink-700 mb-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Clinical Dispatch Hub
          </span>
          <span className="text-brand-700 font-bold">
            {tracking.progressPercent}% Journey Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            {addressLine}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-ink-200/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-700"
            style={{ width: `${tracking.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Live Leaflet Map */}
      <div className="relative h-80 w-full bg-ink-100">
        <MapContainer
          key={`${tracking.staffLatitude.toFixed(4)}-${tracking.staffLongitude.toFixed(4)}`}
          center={[centerLat, centerLng]}
          zoom={14}
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

          {/* Completed path from Dispatch Hub to Staff */}
          <Polyline
            positions={[
              [tracking.originLatitude, tracking.originLongitude],
              [tracking.staffLatitude, tracking.staffLongitude],
            ]}
            pathOptions={{ color: '#94a3b8', weight: 4, dashArray: '6, 8', opacity: 0.7 }}
          />

          {/* Active route from Staff to Patient Home */}
          <Polyline
            positions={[
              [tracking.staffLatitude, tracking.staffLongitude],
              [tracking.patientLatitude, tracking.patientLongitude],
            ]}
            pathOptions={{ color: '#059669', weight: 5, opacity: 0.9 }}
          />

          {/* Staff Live Vehicle Pin */}
          <Marker
            position={[tracking.staffLatitude, tracking.staffLongitude]}
            icon={staffPinIcon}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-ink-900">🚑 {tracking.staffName}</p>
                <p className="text-ink-600 mt-0.5">
                  {isArrived
                    ? 'Arrived at patient location'
                    : `${tracking.distanceKm} km away · ETA ${tracking.etaMinutes} mins`}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Patient Home Pin */}
          <Marker
            position={[tracking.patientLatitude, tracking.patientLongitude]}
            icon={patientHomeIcon}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-ink-900">🏠 {patientName} (Destination)</p>
                <p className="text-ink-600 mt-0.5">{addressLine}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Map Layer Toggle */}
        <button
          type="button"
          onClick={() => setMapLayer((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
          className="absolute top-3 right-3 z-[400] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 text-ink-800 text-xs font-semibold shadow-md ring-1 ring-ink-200 hover:bg-white transition-all"
        >
          <Layers className="h-3.5 w-3.5 text-brand-600" />
          {mapLayer === 'roadmap' ? 'Satellite View' : 'Road Map'}
        </button>

        {/* Live Telemetry Coordinates Pill */}
        <div className="absolute bottom-3 left-3 z-[400] px-3 py-1.5 rounded-xl bg-ink-900/85 text-white text-2xs font-mono backdrop-blur-xs flex items-center gap-2 shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            Staff Pin: {tracking.staffLatitude.toFixed(4)}, {tracking.staffLongitude.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Bottom Action & Contact Bar */}
      <div className="px-6 py-4 bg-white border-t border-ink-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-800 font-bold text-sm flex items-center justify-center shrink-0">
              {tracking.staffName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-ink-900">{tracking.staffName}</p>
                {tracking.staffReviews && tracking.staffReviews.totalReviews > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-300/60 text-2xs font-bold">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                    {tracking.staffReviews.averageRating} ({tracking.staffReviews.totalReviews}{' '}
                    {tracking.staffReviews.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 text-2xs font-semibold">
                    Verified Clinician
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-500">
                Assigned Healthcare Professional{' '}
                {tracking.staffPhone ? `· ${tracking.staffPhone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {tracking.staffPhone ? (
              <a
                href={`tel:${tracking.staffPhone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Staff
              </a>
            ) : null}

            <a
              href={googleMapsLiveRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Live Route in Google Maps
            </a>
          </div>
        </div>

        {/* Customer Reviews about this Staff Member */}
        {tracking.staffReviews && tracking.staffReviews.recentReviews.length > 0 ? (
          <div className="pt-3 border-t border-ink-100">
            <p className="text-2xs font-bold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-1.5">
              <MessageSquareQuote className="h-3.5 w-3.5 text-brand-600" />
              What customers say about {tracking.staffName}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {tracking.staffReviews.recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl bg-ink-50/80 border border-ink-100 p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-ink-800 truncate">{rev.customerName}</span>
                    <span className="text-amber-500 font-bold shrink-0">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(Math.max(0, 5 - rev.rating))}
                    </span>
                  </div>
                  <p className="text-ink-600 line-clamp-2 italic">
                    {rev.reviewText ? `"${rev.reviewText}"` : 'Rated this care visit highly.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
