import { Package, PackageType } from '@prisma/client';
import { addDays } from 'date-fns';
import { BOOKING_NUMBER_PREFIX } from '../utils/constants';

interface VisitScheduleItem {
  bookingId: string;
  sequenceNo: number;
  scheduledStartAt: Date;
  status: 'SCHEDULED';
}

export function generateBookingNumber(citySlug: string, sequence: number): string {
  const cityCode = citySlug.slice(0, 3).toUpperCase();
  const paddedSeq = String(sequence).padStart(6, '0');
  return `${BOOKING_NUMBER_PREFIX}-${cityCode}-${paddedSeq}`;
}

export function generateVisitSchedule(
  bookingId: string,
  pkg: Pick<Package, 'visitCount' | 'durationDays' | 'packageType'>,
  startDate: Date,
): VisitScheduleItem[] {
  const visits: VisitScheduleItem[] = [];

  for (let i = 0; i < pkg.visitCount; i++) {
    let scheduledStartAt: Date;

    if (pkg.packageType === PackageType.PER_VISIT) {
      scheduledStartAt = startDate;
    } else {
      const intervalDays = pkg.durationDays / pkg.visitCount;
      scheduledStartAt = addDays(startDate, Math.floor(i * intervalDays));
    }

    visits.push({
      bookingId,
      sequenceNo: i + 1,
      scheduledStartAt,
      status: 'SCHEDULED',
    });
  }

  return visits;
}
