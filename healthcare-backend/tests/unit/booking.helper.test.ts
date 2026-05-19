import { PackageType } from '@prisma/client';
import { generateBookingNumber, generateVisitSchedule } from '../../src/helper/booking.helper';

describe('generateBookingNumber', () => {
  it('produces the HHS-CITY-000XXX format', () => {
    expect(generateBookingNumber('karachi', 1)).toBe('HHS-KAR-000001');
    expect(generateBookingNumber('lahore', 42)).toBe('HHS-LAH-000042');
    expect(generateBookingNumber('islamabad', 123456)).toBe('HHS-ISL-123456');
  });

  it('uppercases the city slug', () => {
    expect(generateBookingNumber('multan', 7)).toContain('MUL');
  });

  it('zero-pads to six digits regardless of input width', () => {
    expect(generateBookingNumber('khi', 1)).toMatch(/-000001$/);
    expect(generateBookingNumber('khi', 1000000)).toMatch(/-1000000$/);
  });
});

describe('generateVisitSchedule', () => {
  const baseDate = new Date('2026-06-01T10:00:00Z');

  it('PER_VISIT package: all visits scheduled on the same day', () => {
    const visits = generateVisitSchedule(
      'booking-1',
      { visitCount: 3, durationDays: 0, packageType: PackageType.PER_VISIT },
      baseDate,
    );

    expect(visits).toHaveLength(3);
    visits.forEach((v) => {
      expect(v.scheduledStartAt.toISOString()).toBe(baseDate.toISOString());
      expect(v.status).toBe('SCHEDULED');
    });
  });

  it('multi-day package: visits spaced across the durationDays window', () => {
    const visits = generateVisitSchedule(
      'booking-2',
      { visitCount: 5, durationDays: 10, packageType: PackageType.WEEKLY },
      baseDate,
    );

    expect(visits).toHaveLength(5);
    expect(visits[0]?.sequenceNo).toBe(1);
    expect(visits[4]?.sequenceNo).toBe(5);
    // First visit starts on day 0, last starts at floor(4 * (10/5)) = day 8.
    expect(visits[0]?.scheduledStartAt.toISOString()).toBe(baseDate.toISOString());
    expect(visits[4]?.scheduledStartAt.getUTCDate()).toBe(baseDate.getUTCDate() + 8);
  });

  it('attaches sequential sequenceNo and the supplied bookingId', () => {
    const visits = generateVisitSchedule(
      'abc-123',
      { visitCount: 4, durationDays: 4, packageType: PackageType.WEEKLY },
      baseDate,
    );
    expect(visits.map((v) => v.sequenceNo)).toEqual([1, 2, 3, 4]);
    expect(visits.every((v) => v.bookingId === 'abc-123')).toBe(true);
  });
});
