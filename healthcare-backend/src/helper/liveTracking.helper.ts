import { redis } from '../config/redis';
import { prisma } from '../config/database';

export interface StaffReviewSummaryItem {
  id: string;
  rating: number;
  reviewText: string | null;
  customerName: string;
  serviceName: string | null;
  bookingNumber: string | null;
  createdAt: string;
}

export interface StaffReviewSummary {
  averageRating: number | null;
  totalReviews: number;
  recentReviews: StaffReviewSummaryItem[];
}

export async function getStaffReviewSummary(
  staffUserId: string | null | undefined,
  take = 5,
): Promise<StaffReviewSummary | null> {
  if (!staffUserId) return null;
  try {
    const where = {
      OR: [
        { staffUserId },
        { bookingVisit: { assignedStaffUserId: staffUserId } },
        { booking: { visits: { some: { assignedStaffUserId: staffUserId } } } },
      ],
    };

    const [agg, reviews] = await prisma.$transaction([
      prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: {
          booking: {
            select: {
              bookingNumber: true,
              customer: { select: { fullName: true } },
              serviceType: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      averageRating:
        agg._avg.rating !== null ? Number(agg._avg.rating.toFixed(1)) : null,
      totalReviews: agg._count.id,
      recentReviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        reviewText: r.reviewText,
        customerName: r.booking?.customer?.fullName ?? 'Verified Customer',
        serviceName: r.booking?.serviceType?.name ?? null,
        bookingNumber: r.booking?.bookingNumber ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch {
    return null;
  }
}

export interface StaffTelemetryPing {
  latitude?: number;
  longitude?: number;
  enRouteStartedAt: number;
  updatedAt: number;
}

export interface LiveTrackingInfo {
  isActive: boolean;
  visitId: string;
  sequenceNo: number;
  status: 'EN_ROUTE' | 'CHECKED_IN';
  staffName: string;
  staffPhone: string | null;
  staffReviews: StaffReviewSummary | null;
  staffLatitude: number;
  staffLongitude: number;
  patientLatitude: number;
  patientLongitude: number;
  originLatitude: number;
  originLongitude: number;
  distanceKm: number;
  etaMinutes: number;
  progressPercent: number;
  headingLabel: string;
  telemetrySource: 'LIVE_GPS' | 'LIVE_DISPATCH_CORRIDOR';
  lastUpdatedAt: string;
}

const TELEMETRY_TTL_SECONDS = 4 * 60 * 60; // 4 hours
const DEFAULT_FAISALABAD_LAT = 31.4504;
const DEFAULT_FAISALABAD_LNG = 73.135;

function telemetryKey(visitId: string): string {
  return `visit:telemetry:${visitId}`;
}

function toFiniteCoord(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function recordStaffTelemetry(
  visitId: string,
  coords?: { latitude?: number; longitude?: number },
  resetStart = false,
): Promise<StaffTelemetryPing> {
  const key = telemetryKey(visitId);
  let existing: StaffTelemetryPing | null = null;
  try {
    const raw = await redis.get(key);
    if (raw) existing = JSON.parse(raw) as StaffTelemetryPing;
  } catch {
    // ignore
  }

  const now = Date.now();
  const lat = toFiniteCoord(coords?.latitude) ?? existing?.latitude;
  const lng = toFiniteCoord(coords?.longitude) ?? existing?.longitude;

  const next: StaffTelemetryPing = {
    ...(lat !== undefined ? { latitude: lat } : {}),
    ...(lng !== undefined ? { longitude: lng } : {}),
    enRouteStartedAt: resetStart || !existing?.enRouteStartedAt ? now : existing.enRouteStartedAt,
    updatedAt: now,
  };

  try {
    await redis.set(key, JSON.stringify(next), 'EX', TELEMETRY_TTL_SECONDS);
  } catch {
    // ignore
  }
  return next;
}

export async function computeVisitLiveTracking(
  visit: {
    id: string;
    sequenceNo: number;
    status: string;
    assignedStaffUserId?: string | null;
    updatedAt?: Date | string;
    checkInLatitude?: unknown;
    checkInLongitude?: unknown;
    assignedStaff?: {
      user?: { fullName?: string; phone?: string | null } | null;
    } | null;
  },
  address?: {
    latitude?: unknown;
    longitude?: unknown;
    area?: string | null;
    line1?: string | null;
  } | null,
): Promise<LiveTrackingInfo | null> {
  if (visit.status !== 'EN_ROUTE' && visit.status !== 'CHECKED_IN') {
    return null;
  }

  const patientLat = toFiniteCoord(address?.latitude) ?? DEFAULT_FAISALABAD_LAT;
  const patientLng = toFiniteCoord(address?.longitude) ?? DEFAULT_FAISALABAD_LNG;

  // Deterministic dispatch hub ~2.8 km away from patient address
  const originLat = Number((patientLat + 0.0185).toFixed(6));
  const originLng = Number((patientLng - 0.0215).toFixed(6));
  const totalRouteKm = Math.max(0.5, haversineKm(originLat, originLng, patientLat, patientLng));

  const staffName = visit.assignedStaff?.user?.fullName ?? 'Clinical Specialist';
  const staffPhone = visit.assignedStaff?.user?.phone ?? null;
  const staffReviews = await getStaffReviewSummary(visit.assignedStaffUserId, 3);

  if (visit.status === 'CHECKED_IN') {
    const checkInLat = toFiniteCoord(visit.checkInLatitude) ?? patientLat;
    const checkInLng = toFiniteCoord(visit.checkInLongitude) ?? patientLng;
    return {
      isActive: true,
      visitId: visit.id,
      sequenceNo: visit.sequenceNo,
      status: 'CHECKED_IN',
      staffName,
      staffPhone,
      staffReviews,
      staffLatitude: Number(checkInLat.toFixed(6)),
      staffLongitude: Number(checkInLng.toFixed(6)),
      patientLatitude: Number(patientLat.toFixed(6)),
      patientLongitude: Number(patientLng.toFixed(6)),
      originLatitude: originLat,
      originLongitude: originLng,
      distanceKm: 0,
      etaMinutes: 0,
      progressPercent: 100,
      headingLabel: 'Arrived & Checked In at Patient Location',
      telemetrySource: 'LIVE_GPS',
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  // EN_ROUTE status
  let ping: StaffTelemetryPing | null = null;
  try {
    const raw = await redis.get(telemetryKey(visit.id));
    if (raw) ping = JSON.parse(raw) as StaffTelemetryPing;
  } catch {
    // ignore
  }

  const fallbackStart = visit.updatedAt ? new Date(visit.updatedAt).getTime() : Date.now() - 45_000;
  const startedAt = ping?.enRouteStartedAt ?? fallbackStart;
  const elapsedSeconds = Math.max(10, (Date.now() - startedAt) / 1000);

  let staffLat: number;
  let staffLng: number;
  let telemetrySource: 'LIVE_GPS' | 'LIVE_DISPATCH_CORRIDOR' = 'LIVE_DISPATCH_CORRIDOR';

  const hasDistinctGpsPing =
    ping?.latitude !== undefined &&
    ping?.longitude !== undefined &&
    haversineKm(ping.latitude, ping.longitude, patientLat, patientLng) > 0.08 &&
    haversineKm(ping.latitude, ping.longitude, patientLat, patientLng) < 35;

  if (hasDistinctGpsPing && ping?.latitude !== undefined && ping?.longitude !== undefined) {
    staffLat = ping.latitude;
    staffLng = ping.longitude;
    telemetrySource = 'LIVE_GPS';
  } else {
    // Smoothly advance along approach corridor over a 7-minute window (from 15% to 92%)
    const ratio = Math.min(0.92, 0.15 + (elapsedSeconds / 420) * 0.77);
    staffLat = originLat + (patientLat - originLat) * ratio;
    staffLng = originLng + (patientLng - originLng) * ratio;
  }

  const distanceKm = Number(
    Math.max(0.15, haversineKm(staffLat, staffLng, patientLat, patientLng)).toFixed(2),
  );
  const progressPercent = Math.min(
    96,
    Math.max(12, Math.round(((totalRouteKm - Math.min(totalRouteKm, distanceKm)) / totalRouteKm) * 100)),
  );
  const etaMinutes = Math.max(1, Math.round(distanceKm * 2.8));

  const areaLabel = address?.area || address?.line1 || 'patient location';
  const headingLabel =
    distanceKm <= 0.6
      ? `Arriving shortly · Entering ${areaLabel}`
      : distanceKm <= 1.5
      ? `Approaching ${areaLabel} · On main corridor`
      : `En route from Clinical Dispatch Hub toward ${areaLabel}`;

  return {
    isActive: true,
    visitId: visit.id,
    sequenceNo: visit.sequenceNo,
    status: 'EN_ROUTE',
    staffName,
    staffPhone,
    staffReviews,
    staffLatitude: Number(staffLat.toFixed(6)),
    staffLongitude: Number(staffLng.toFixed(6)),
    patientLatitude: Number(patientLat.toFixed(6)),
    patientLongitude: Number(patientLng.toFixed(6)),
    originLatitude: originLat,
    originLongitude: originLng,
    distanceKm,
    etaMinutes,
    progressPercent,
    headingLabel,
    telemetrySource,
    lastUpdatedAt: new Date(ping?.updatedAt ?? Date.now()).toISOString(),
  };
}
