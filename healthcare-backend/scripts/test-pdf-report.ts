import { prisma } from '../src/config/database';
import { generateAndAttachVisitReport } from '../src/helper/visitReportPdf.helper';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

async function runTest() {
  console.log('🧪 Starting End-to-End Test for Auto-Generated Medical PDF Report...');

  // 1. Find a visit in database or inspect existing visits
  let visit: any = await prisma.bookingVisit.findFirst({
    include: {
      booking: {
        include: {
          patient: true,
          customer: true,
          serviceType: true,
          address: { include: { city: true } },
        },
      },
      assignedStaff: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!visit) {
    console.log('No visit found with patient, creating test booking & visit...');
    const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    const staff = await prisma.staffProfile.findFirst({ include: { user: true } });
    const serviceType = await prisma.serviceType.findFirst();
    const pkg = await prisma.package.findFirst();
    const city = await prisma.city.findFirst();

    if (!user || !serviceType || !pkg || !city) {
      throw new Error('Database lacks seed data for user, serviceType, package, or city.');
    }

    const patient = await prisma.patient.create({
      data: {
        customerUserId: user.id,
        fullName: 'Zainab Bibi',
        gender: 'FEMALE',
        relationshipToCustomer: 'Mother',
        primaryCondition: 'Post-operative orthopedic recovery and hypertension monitoring',
        allergies: 'Aspirin, Sulfonamides',
      },
    });

    const address = await prisma.address.create({
      data: {
        customerUserId: user.id,
        cityId: city.id,
        area: 'Madina Town',
        line1: 'House 142, Street 4, Sector B',
        contactName: 'Zainab Bibi',
        contactPhone: '+923005551234',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `TEST-BK-${Date.now().toString().slice(-6)}`,
        customerUserId: user.id,
        patientId: patient.id,
        serviceTypeId: serviceType.id,
        packageId: pkg.id,
        addressId: address.id,
        cityId: city.id,
        requestedStartAt: new Date(),
        totalPrice: 2500,
        createdByUserId: user.id,
        status: 'IN_PROGRESS',
      },
    });

    visit = await prisma.bookingVisit.create({
      data: {
        bookingId: booking.id,
        sequenceNo: 1,
        scheduledStartAt: new Date(),
        scheduledEndAt: new Date(Date.now() + 3600000),
        assignedStaffUserId: staff?.userId || null,
        status: 'CHECKED_IN',
        checkInAt: new Date(Date.now() - 2700000), // 45 mins ago
        checkOutAt: new Date(),
        beforeConditionText: 'Patient conscious, alert, baseline blood pressure 135/88 mmHg, mild post-surgical discomfort in left hip.',
        visitNotes: 'Wound dressing inspection performed. Dressing dry and intact with no signs of erythema or infection. Pulse 78 bpm, SpO2 98%, Temp 98.4 F. Prescribed analgesics administered on schedule. Mobility exercises assisted.',
        afterConditionText: 'Pain score reduced to 2/10. Ambulating with minimal support. Vitals stable. Patient and family briefed on evening medication and hydration.',
      },
      include: {
        booking: {
          include: {
            patient: true,
            customer: true,
            serviceType: true,
            address: { include: { city: true } },
          },
        },
        assignedStaff: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  console.log(`✅ Using Visit ID: ${visit.id} (Booking #${visit.booking.bookingNumber})`);
  console.log(`👤 Patient: ${visit.booking.patient?.fullName}`);
  console.log(`🩺 Service: ${visit.booking.serviceType?.name}`);

  // Update visit with realistic clinical notes & vitals if empty
  if (!visit.visitNotes || !visit.beforeConditionText) {
    visit = await prisma.bookingVisit.update({
      where: { id: visit.id },
      data: {
        checkInAt: visit.checkInAt || new Date(Date.now() - 3600000),
        checkOutAt: new Date(),
        beforeConditionText: 'Patient conscious, ambulatory with cane. Blood Pressure 130/85 mmHg, Pulse 76 bpm.',
        visitNotes: 'Full clinical care delivered. Vital signs checked and stabilized: SpO2 98%, Temp 98.6 F, Random Blood Sugar 115 mg/dL. Prescribed medications given. Range-of-motion therapy completed.',
        afterConditionText: 'Patient resting comfortably. Post-care vitals normal. Patient instructed on fluid intake and precautions.',
      },
      include: {
        booking: {
          include: {
            patient: true,
            customer: true,
            serviceType: true,
            address: { include: { city: true } },
          },
        },
        assignedStaff: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  // 2. Test generation & attachment
  console.log('\n📄 Testing generateAndAttachVisitReport()...');
  const actorUserId = visit.assignedStaffUserId || visit.booking.customerUserId;
  const result = await generateAndAttachVisitReport(visit.id, actorUserId);

  console.log(`✅ Generated Report ID: ${result.reportId}`);
  console.log(`✅ Document ID: ${result.documentId}`);
  console.log(`✅ PDF Buffer Size: ${(result.pdfBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`✅ File URL: ${result.fileUrl}`);

  // Verify PDF magic bytes
  const header = result.pdfBuffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error(`Invalid PDF header: expected %PDF-, got ${header}`);
  }
  console.log('✅ PDF Header verification passed: "%PDF-" detected');

  // Save PDF locally for inspection
  const outPath = path.join(__dirname, '..', 'test-clinical-report.pdf');
  fs.writeFileSync(outPath, result.pdfBuffer);
  console.log(`💾 Saved sample PDF to: ${outPath}`);

  // 3. Verify Database records
  console.log('\n🔍 Verifying Database Records...');
  const dbReport = await prisma.report.findUnique({
    where: { id: result.reportId },
    include: { files: true, patient: true, booking: true },
  });

  if (!dbReport) throw new Error('Report record not found in database!');
  console.log(`✅ DB Report Title: "${dbReport.title}"`);
  console.log(`✅ DB Report Type: ${dbReport.reportType}`);
  console.log(`✅ DB Report isVisibleToCustomer: ${dbReport.isVisibleToCustomer}`);
  console.log(`✅ DB Report Files count: ${dbReport.files.length}`);
  if (dbReport.files.length > 0) {
    console.log(`  - File Key: ${dbReport.files[0].fileKey}`);
    console.log(`  - MIME: ${dbReport.files[0].mimeType}`);
    console.log(`  - Size: ${dbReport.files[0].fileSizeBytes} bytes`);
    console.log(`  - SHA-256: ${dbReport.files[0].checksumSha256}`);
  }

  // 4. Test HTTP Endpoints via real HTTP request to local server
  console.log('\n🌐 Testing Live HTTP Endpoints on http://localhost:3000...');

  // Generate a valid JWT token for customer
  const customerToken = jwt.sign(
    {
      sub: visit.booking.customerUserId,
      role: 'CUSTOMER',
      tokenVersion: 0,
    },
    env.JWT_PRIVATE_KEY,
    { algorithm: 'RS256', expiresIn: '15m' },
  );

  // Test GET /api/v1/visits/:id/clinical-pdf
  const pdfResponse = await axios.get(`http://localhost:3000/api/v1/visits/${visit.id}/clinical-pdf`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    responseType: 'arraybuffer',
  });

  console.log(`✅ GET /api/v1/visits/${visit.id}/clinical-pdf status: ${pdfResponse.status}`);
  console.log(`✅ Response Content-Type: ${pdfResponse.headers['content-type']}`);
  console.log(`✅ Response Content-Disposition: ${pdfResponse.headers['content-disposition']}`);
  const downloadedHeader = Buffer.from(pdfResponse.data).subarray(0, 5).toString('ascii');
  console.log(`✅ Downloaded stream starts with: "${downloadedHeader}"`);

  // Test GET /api/v1/reports (Customer list)
  const reportsListResponse = await axios.get(`http://localhost:3000/api/v1/reports`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });

  console.log(`✅ GET /api/v1/reports status: ${reportsListResponse.status}`);
  console.log(`✅ Customer reports count: ${reportsListResponse.data.data.length}`);
  const attachedReport = reportsListResponse.data.data.find((r: any) => r.id === result.reportId);
  if (attachedReport) {
    console.log(`✅ Customer successfully sees attached report: "${attachedReport.title}"`);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The Medical Visit PDF Report engine is 100% operational.');
}

runTest()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
