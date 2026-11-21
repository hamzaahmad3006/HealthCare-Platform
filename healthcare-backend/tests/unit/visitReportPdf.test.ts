import {
  generateClinicalVisitPdfBuffer,
  extractOrFallbackVitals,
  type ClinicalPdfData,
} from '../../src/helper/visitReportPdf.helper';

describe('Medical Visit Clinical PDF Helper', () => {
  it('extracts vitals from clinical text correctly', () => {
    const rawText = 'Patient visit. BP: 135/85. Heart Rate: 82 bpm. Temp: 99.1 F. SpO2: 97%. Sugar: 125 mg/dl.';
    const vitals = extractOrFallbackVitals(rawText);

    expect(vitals.bloodPressure).toBe('135/85 mmHg');
    expect(vitals.heartRate).toBe('82 bpm');
    expect(vitals.temperature).toBe('99.1 °F');
    expect(vitals.oxygenSaturation).toBe('97%');
    expect(vitals.bloodSugar).toBe('125 mg/dL');
    expect(vitals.respiratoryRate).toBe('16 bpm');
  });

  it('falls back to standard clinical vitals if none are specified in raw text', () => {
    const vitals = extractOrFallbackVitals('Routine wellness care visit.');
    expect(vitals.bloodPressure).toBe('120/80 mmHg');
    expect(vitals.heartRate).toBe('74 bpm');
    expect(vitals.oxygenSaturation).toBe('98%');
  });

  it('generates a valid binary PDF buffer starting with %PDF-', async () => {
    const mockData: ClinicalPdfData = {
      documentId: 'MED-RPT-BK-9912-V1',
      bookingNumber: 'BK-9912',
      sequenceNo: 1,
      totalVisits: 1,
      serviceName: 'Senior Care Assistance',
      serviceCode: 'ELDERLY_CARE',
      patient: {
        fullName: 'Abdul Rehman',
        gender: 'MALE',
        dateOfBirth: '1952-04-12',
        relationship: 'Father',
        primaryCondition: 'Hypertension & Mild Arthritis',
        allergies: 'Penicillin',
        address: 'House #44, Street 9, Peoples Colony #1',
        city: 'Faisalabad',
        contactPhone: '03001234567',
      },
      visitTimings: {
        scheduledStart: new Date(),
        checkInAt: new Date(Date.now() - 3600000),
        checkOutAt: new Date(),
        durationMinutes: 60,
      },
      clinicalAssessment: {
        beforeCondition: 'Patient oriented, mild stiffness in right knee, ambulatory with cane.',
        visitNotes: 'Administered prescribed morning dose. Joint mobility exercises completed. Vitals stable.',
        afterCondition: 'Pain improved to 2/10. Ambulating comfortably with assistance.',
        vitals: {
          bloodPressure: '128/82 mmHg',
          heartRate: '72 bpm',
          oxygenSaturation: '99%',
        },
      },
      attendingStaff: {
        fullName: 'Dr. Usman Tariq',
        staffCode: 'DOC-8821',
        phone: '03009876543',
      },
      completedAt: new Date(),
    };

    const buffer = await generateClinicalVisitPdfBuffer(mockData);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify valid PDF file header "%PDF-"
    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });
});
