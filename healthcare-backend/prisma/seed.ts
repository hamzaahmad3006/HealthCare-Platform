import { PrismaClient, PackageType, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // ── Admin User ──────────────────────────────────────────────────────────────
  const adminPasswordHash = await argon2.hash('Admin@1234', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { phone: '+923001234567' },
    update: {},
    create: {
      role: Role.ADMIN,
      fullName: 'System Admin',
      email: 'admin@healthcare.com',
      phone: '+923001234567',
      passwordHash: adminPasswordHash,
      phoneVerified: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // ── City: Faisalabad ────────────────────────────────────────────────────────
  const faisalabad = await prisma.city.upsert({
    where: { slug: 'faisalabad' },
    update: {},
    create: {
      name: 'Faisalabad',
      slug: 'faisalabad',
      isActive: true,
    },
  });
  console.log(`✅ City: ${faisalabad.name}`);

  // ── Zones: Faisalabad ───────────────────────────────────────────────────────
  const zoneData = [
    { name: 'Gulberg', slug: 'gulberg' },
    { name: 'Madina Town', slug: 'madina-town' },
    { name: 'Peoples Colony', slug: 'peoples-colony' },
    { name: 'Dijkot Road', slug: 'dijkot-road' },
  ];

  for (const zone of zoneData) {
    await prisma.zone.upsert({
      where: { cityId_slug: { cityId: faisalabad.id, slug: zone.slug } },
      update: {},
      create: {
        cityId: faisalabad.id,
        name: zone.name,
        slug: zone.slug,
        isActive: true,
      },
    });
    console.log(`  ✅ Zone: ${zone.name}`);
  }

  // ── Service Types ───────────────────────────────────────────────────────────
  const serviceTypeData = [
    {
      code: 'NURSING',
      name: 'Nursing Care',
      description: 'Professional nursing services at home including wound care, IV therapy, and medication administration.',
    },
    {
      code: 'CAREGIVER',
      name: 'Caregiver',
      description: 'Dedicated caregiver support for elderly and patients needing daily assistance.',
    },
    {
      code: 'LAB_SAMPLING',
      name: 'Lab Sampling',
      description: 'Home collection of blood, urine, and other specimens for laboratory testing.',
    },
    {
      code: 'VISITING_DOCTOR',
      name: 'Visiting Doctor',
      description: 'MBBS/Specialist doctor visits at home for consultations and follow-ups.',
    },
    {
      code: 'PHYSIOTHERAPY',
      name: 'Physiotherapy',
      description: 'In-home physiotherapy sessions for rehabilitation and pain management.',
    },
    {
      code: 'AMBULANCE',
      name: 'Ambulance',
      description: 'Equipped ambulance service for patient transfers and emergencies.',
    },
  ];

  const serviceTypes: Record<string, string> = {};

  for (const st of serviceTypeData) {
    const created = await prisma.serviceType.upsert({
      where: { code: st.code },
      update: {},
      create: {
        code: st.code,
        name: st.name,
        description: st.description,
        isActive: true,
      },
    });
    serviceTypes[st.code] = created.id;
    console.log(`✅ Service Type: ${st.name}`);
  }

  // ── Packages: 2 per service type (PER_VISIT + MONTHLY) ─────────────────────
  const packageData: Array<{
    serviceCode: string;
    name: string;
    packageType: PackageType;
    durationDays: number;
    visitCount: number;
    priceAmount: number;
    description: string;
  }> = [
    // NURSING
    {
      serviceCode: 'NURSING',
      name: 'Nursing — Per Visit',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 1500,
      description: 'Single nursing home visit.',
    },
    {
      serviceCode: 'NURSING',
      name: 'Nursing — Monthly Care',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 30,
      priceAmount: 35000,
      description: 'Daily nursing care for 30 days.',
    },
    // CAREGIVER
    {
      serviceCode: 'CAREGIVER',
      name: 'Caregiver — Per Visit',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 1200,
      description: 'Single caregiver home visit.',
    },
    {
      serviceCode: 'CAREGIVER',
      name: 'Caregiver — Monthly Support',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 30,
      priceAmount: 28000,
      description: 'Daily caregiver support for 30 days.',
    },
    // LAB_SAMPLING
    {
      serviceCode: 'LAB_SAMPLING',
      name: 'Lab Sampling — Single Collection',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 800,
      description: 'Single home specimen collection.',
    },
    {
      serviceCode: 'LAB_SAMPLING',
      name: 'Lab Sampling — Monthly Plan',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 4,
      priceAmount: 2800,
      description: 'Weekly specimen collection for 30 days.',
    },
    // VISITING_DOCTOR
    {
      serviceCode: 'VISITING_DOCTOR',
      name: 'Visiting Doctor — Consultation',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 2500,
      description: 'Single home doctor consultation.',
    },
    {
      serviceCode: 'VISITING_DOCTOR',
      name: 'Visiting Doctor — Monthly Follow-up',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 4,
      priceAmount: 8500,
      description: 'Weekly doctor follow-up visits for 30 days.',
    },
    // PHYSIOTHERAPY
    {
      serviceCode: 'PHYSIOTHERAPY',
      name: 'Physiotherapy — Single Session',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 1800,
      description: 'Single physiotherapy session at home.',
    },
    {
      serviceCode: 'PHYSIOTHERAPY',
      name: 'Physiotherapy — Monthly Rehab',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 12,
      priceAmount: 18000,
      description: 'Three sessions per week for 30 days.',
    },
    // AMBULANCE
    {
      serviceCode: 'AMBULANCE',
      name: 'Ambulance — Single Transfer',
      packageType: PackageType.PER_VISIT,
      durationDays: 1,
      visitCount: 1,
      priceAmount: 3000,
      description: 'Single ambulance trip within city.',
    },
    {
      serviceCode: 'AMBULANCE',
      name: 'Ambulance — Monthly Standby',
      packageType: PackageType.MONTHLY,
      durationDays: 30,
      visitCount: 4,
      priceAmount: 10000,
      description: 'Four ambulance transfers within 30 days.',
    },
  ];

  for (const pkg of packageData) {
    const serviceTypeId = serviceTypes[pkg.serviceCode];
    if (!serviceTypeId) continue;

    await prisma.package.create({
      data: {
        serviceTypeId,
        name: pkg.name,
        packageType: pkg.packageType,
        durationDays: pkg.durationDays,
        visitCount: pkg.visitCount,
        priceAmount: pkg.priceAmount,
        currency: 'PKR',
        description: pkg.description,
        isActive: true,
        cityId: null,
      },
    });
    console.log(`  ✅ Package: ${pkg.name} — PKR ${pkg.priceAmount}`);
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
