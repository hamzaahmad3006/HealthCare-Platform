import type {
  StaffProfileDraft,
  ServiceOption,
  CityOption,
  StaffOnboardingProfile,
  VerificationFile,
} from '../types/staffOnboarding.types';

export function staffCanWork(
  profile: Pick<
    StaffOnboardingProfile,
    'verificationStatus' | 'profileCompletedAt'
  > | null,
): boolean {
  return Boolean(
    profile?.profileCompletedAt && profile.verificationStatus === 'VERIFIED',
  );
}
export function staffProfilePayload(
  draft: StaffProfileDraft,
  services: ServiceOption[],
  cities: CityOption[],
) {
  const city = cities.find(c => c.id === draft.cityId);
  if (!city) throw new Error('Select a city.');
  if (draft.zoneId && !city.zones.some(z => z.id === draft.zoneId))
    throw new Error('Select a zone in your city.');
  if (
    !/^[0-9-]+$/.test(draft.cnic) ||
    draft.cnic.replace(/-/g, '').length !== 13
  )
    throw new Error('CNIC must contain 13 digits.');
  if (
    !draft.serviceTypeIds.length ||
    draft.serviceTypeIds.some(id => !services.some(s => s.id === id))
  )
    throw new Error('Select at least one available service.');
  if (
    !/^\d+$/.test(draft.experienceYears) ||
    Number(draft.experienceYears) > 60
  )
    throw new Error('Experience must be a whole number from 0 to 60.');
  if (
    draft.dateOfBirth &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dateOfBirth) ||
      !Number.isFinite(Date.parse(draft.dateOfBirth)) ||
      new Date(draft.dateOfBirth).toISOString().slice(0, 10) !==
        draft.dateOfBirth ||
      Date.parse(draft.dateOfBirth) >= Date.now())
  )
    throw new Error('Enter a valid past date of birth (YYYY-MM-DD).');
  const ambulance = services.some(
    s => s.code === 'AMBULANCE' && draft.serviceTypeIds.includes(s.id),
  );
  if (ambulance && !/^[A-Za-z0-9\- ]{3,20}$/.test(draft.ambulanceNumber.trim()))
    throw new Error(
      'Enter a valid ambulance registration number (3–20 characters).',
    );
  return {
    cityId: draft.cityId,
    cnic: draft.cnic,
    experienceYears: Number(draft.experienceYears),
    serviceTypeIds: [...new Set(draft.serviceTypeIds)],
    ...(draft.zoneId ? { zoneId: draft.zoneId } : {}),
    ...(draft.gender ? { gender: draft.gender } : {}),
    ...(draft.dateOfBirth ? { dateOfBirth: draft.dateOfBirth } : {}),
    ...(ambulance ? { ambulanceNumber: draft.ambulanceNumber.trim() } : {}),
  };
}
export function validateVerificationFile(file: VerificationFile): void {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))
    throw new Error('Choose a PDF, JPEG or PNG file.');
  if (
    !Number.isInteger(file.size) ||
    file.size <= 0 ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error('Choose a non-empty file up to 10 MB.');
}
