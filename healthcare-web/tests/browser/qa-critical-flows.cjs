// Comprehensive Playwright E2E browser regression suite for Customer, Staff, and Admin critical flows.
// Uses synthetic API fixtures only — no real database, payments, or notifications.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE_URL = process.env.WEB_TEST_URL ?? 'http://127.0.0.1:5174';

const USERS = {
  CUSTOMER: {
    id: 'cust-1',
    role: 'CUSTOMER',
    fullName: 'Ayesha Customer',
    phone: '+923001112233',
    email: 'ayesha@example.test',
  },
  STAFF_UNVERIFIED: {
    id: 'staff-unverified',
    role: 'STAFF',
    fullName: 'Bilal Nurse',
    phone: '+923004445566',
    staffProfileCompletedAt: '2026-01-01T00:00:00Z',
    staffVerificationStatus: 'PENDING',
  },
  STAFF_INCOMPLETE: {
    id: 'staff-incomplete',
    role: 'STAFF',
    fullName: 'New Staff',
    phone: '+923004445567',
    staffProfileCompletedAt: null,
    staffVerificationStatus: 'PENDING',
  },
  STAFF_VERIFIED: {
    id: 'staff-verified',
    role: 'STAFF',
    fullName: 'Dr. Sara Khan',
    phone: '+923007778899',
    staffProfileCompletedAt: '2026-01-01T00:00:00Z',
    staffVerificationStatus: 'VERIFIED',
  },
  ADMIN: {
    id: 'admin-1',
    role: 'ADMIN',
    fullName: 'System Admin',
    phone: '+923009990000',
  },
};

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    headless: true,
  });

  try {
    // ── 1. Role Restrictions & Route Isolation ─────────────────────────────────
    {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      let activeUser = null;
      await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api/v1', '');
        if (path === '/auth/refresh') {
          if (!activeUser) {
            return route.fulfill({ status: 401, json: { success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } } });
          }
          return route.fulfill({ json: { success: true, data: { accessToken: 'test-token', expiresIn: 900 } } });
        }
        if (path === '/auth/me') {
          if (!activeUser) {
            return route.fulfill({ status: 401, json: { success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } } });
          }
          return route.fulfill({ json: { success: true, data: activeUser } });
        }
        if (path === '/admin/overview') {
          return route.fulfill({
            json: {
              success: true,
              data: {
                bookings: { total: 5, byStatus: { PENDING: 2, CONFIRMED: 1, COMPLETED: 2 } },
                visits: { todayTotal: 1, completedToday: 1 },
                staff: { total: 3, verified: 2, pendingVerification: 1, available: 2 },
                customers: { total: 4 },
                revenue: { totalPaidAmount: '5000', pendingAmount: '2500', currency: 'PKR' },
                reviews: { averageRating: 4.8, lowRatingCount: 0 },
              },
            },
          });
        }
        return route.fulfill({ json: { success: true, data: [], meta: { total: 0, page: 1, limit: 20, hasNext: false } } });
      });

      // Unauthenticated user redirected to /auth/login on protected routes
      for (const protectedPath of ['/my-bookings', '/book', '/my-patients', '/my-reports', '/my-account', '/account', '/admin', '/staff/visits', '/complete-profile']) {
        await page.goto(`${BASE_URL}${protectedPath}`);
        await page.waitForURL('**/auth/login');
      }

      // CUSTOMER blocked from /admin, /staff/*, /complete-profile and redirected to /my-bookings; /account -> /my-account
      activeUser = USERS.CUSTOMER;
      for (const forbiddenPath of ['/admin', '/admin/bookings', '/staff/visits', '/complete-profile']) {
        await page.goto(`${BASE_URL}${forbiddenPath}`);
        await page.waitForURL('**/my-bookings');
      }
      await page.goto(`${BASE_URL}/account`);
      await page.waitForURL('**/my-account');

      // STAFF (completed profile) blocked from customer routes and /admin -> redirected to /staff/visits
      activeUser = USERS.STAFF_VERIFIED;
      for (const forbiddenPath of ['/book', '/my-bookings', '/my-patients', '/my-reports', '/my-account', '/account', '/admin']) {
        await page.goto(`${BASE_URL}${forbiddenPath}`);
        await page.waitForURL('**/staff/visits');
      }

      // STAFF (incomplete profile) blocked from customer routes and /admin -> redirected to /complete-profile
      activeUser = USERS.STAFF_INCOMPLETE;
      for (const forbiddenPath of ['/book', '/my-bookings', '/admin']) {
        await page.goto(`${BASE_URL}${forbiddenPath}`);
        await page.waitForURL('**/complete-profile');
      }

      // ADMIN blocked from customer routes and /staff/* -> redirected to /admin
      activeUser = USERS.ADMIN;
      for (const forbiddenPath of ['/book', '/my-bookings', '/my-patients', '/my-reports', '/my-account', '/staff/visits', '/complete-profile']) {
        await page.goto(`${BASE_URL}${forbiddenPath}`);
        await page.waitForURL('**/admin');
      }

      assert.deepEqual(pageErrors, []);
      console.log('PASS: role isolation and route guards for unauthenticated, customer, staff, and admin');
      await page.close();
    }

    // ── 2. Customer Critical Flows (Bookings, Doctor Time Proposal, Patients) ──
    {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      let failMyBookingsOnce = true;
      let failMyPatientsOnce = true;
      let proposedBookingStatus = 'TIME_PROPOSED';
      const queriedStatuses = new Set();
      let acceptTimeCalled = 0;

      await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api/v1', '');
        const method = route.request().method();

        if (path === '/auth/refresh') {
          return route.fulfill({ json: { success: true, data: { accessToken: 'cust-token', expiresIn: 900 } } });
        }
        if (path === '/auth/me') {
          return route.fulfill({ json: { success: true, data: USERS.CUSTOMER } });
        }
        if (path === '/bookings' && method === 'GET') {
          const st = url.searchParams.get('status');
          if (st) queriedStatuses.add(st);
          if (failMyBookingsOnce) {
            failMyBookingsOnce = false;
            return route.fulfill({
              status: 503,
              json: { success: false, error: { code: 'UNAVAILABLE', message: 'Bookings service temporarily unavailable' } },
            });
          }
          const byStatus = {
            PENDING_DOCTOR: [
              {
                id: 'b-doc-1',
                bookingNumber: 'BK-2026-DOC1',
                status: 'PENDING_DOCTOR',
                requestedStartAt: '2030-05-10T10:00:00Z',
                totalPrice: '3500',
                currency: 'PKR',
                urgencyLevel: 'NORMAL',
                createdAt: '2026-05-01T10:00:00Z',
                patient: { fullName: 'Ahmed Khan' },
                serviceType: { code: 'VISITING_DOCTOR', name: 'Visiting Doctor' },
                package: { name: 'Doctor Consultation' },
              },
            ],
            TIME_PROPOSED: [
              {
                id: 'b-prop-1',
                bookingNumber: 'BK-2026-PROP1',
                status: proposedBookingStatus,
                requestedStartAt: '2030-05-11T10:00:00Z',
                proposedStartAt: '2030-05-11T14:00:00Z',
                totalPrice: '3500',
                currency: 'PKR',
                urgencyLevel: 'URGENT',
                createdAt: '2026-05-02T10:00:00Z',
                patient: { fullName: 'Zainab Bibi' },
                serviceType: { code: 'VISITING_DOCTOR', name: 'Visiting Doctor' },
                package: { name: 'Doctor Consultation' },
              },
            ],
          };
          const rows = byStatus[st] ?? [];
          return route.fulfill({
            json: { success: true, data: rows, meta: { total: rows.length, page: 1, limit: 20, hasNext: false } },
          });
        }
        if (path === '/bookings/b-prop-1' && method === 'GET') {
          return route.fulfill({
            json: {
              success: true,
              data: {
                id: 'b-prop-1',
                bookingNumber: 'BK-2026-PROP1',
                status: proposedBookingStatus,
                requestedStartAt: '2030-05-11T10:00:00Z',
                proposedStartAt: '2030-05-11T14:00:00Z',
                totalPrice: '3500',
                currency: 'PKR',
                urgencyLevel: 'URGENT',
                canReschedule: false,
                createdAt: '2026-05-02T10:00:00Z',
                patient: { fullName: 'Zainab Bibi', relationshipToCustomer: 'Mother', primaryCondition: 'Hypertension' },
                serviceType: { id: 'st-doc', code: 'VISITING_DOCTOR', name: 'Visiting Doctor' },
                package: { id: 'pkg-doc', name: 'Doctor Consultation', packageType: 'PER_VISIT', visitCount: 1, durationDays: 1 },
                address: { line1: 'House 12, Street 4', area: 'DHA Phase 5', contactPhone: '+923001112233' },
                city: { name: 'Lahore' },
                visits: [{ id: 'v-1', sequenceNo: 1, scheduledStartAt: '2030-05-11T10:00:00Z', status: 'SCHEDULED', checkInAt: null, checkOutAt: null }],
                payments: [{ id: 'pay-1', paymentMethod: 'CASH', status: 'PENDING', amount: '3500' }],
                reviews: [],
              },
            },
          });
        }
        if (path === '/bookings/b-prop-1/customer-accept-time' && method === 'PATCH') {
          acceptTimeCalled++;
          proposedBookingStatus = 'PENDING';
          return route.fulfill({ json: { success: true, data: { id: 'b-prop-1', status: 'PENDING' } } });
        }
        if (path === '/users/patients' && method === 'GET') {
          if (failMyPatientsOnce) {
            failMyPatientsOnce = false;
            return route.fulfill({
              status: 503,
              json: { success: false, error: { code: 'UNAVAILABLE', message: 'Patients list temporarily unavailable' } },
            });
          }
          return route.fulfill({
            json: {
              success: true,
              data: [{ id: 'p-1', fullName: 'Zainab Bibi', gender: 'FEMALE', relationshipToCustomer: 'Mother' }],
              meta: { total: 1, page: 1, limit: 20, hasNext: false },
            },
          });
        }
        return route.fulfill({ json: { success: true, data: [], meta: { total: 0, page: 1, limit: 20, hasNext: false } } });
      });

      await page.goto(`${BASE_URL}/my-bookings`);
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      assert.equal(await page.getByText('No active bookings yet', { exact: true }).count(), 0);

      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('BK-2026-DOC1', { exact: true }).waitFor();
      await page.getByText('BK-2026-PROP1', { exact: true }).waitFor();
      assert.equal(queriedStatuses.has('PENDING_DOCTOR'), true);
      assert.equal(queriedStatuses.has('TIME_PROPOSED'), true);
      assert.equal(await page.getByRole('alert').count(), 0);

      // Open TIME_PROPOSED booking detail and accept the doctor's proposed time
      await page.getByText('BK-2026-PROP1', { exact: true }).click();
      await page.getByText('Doctor proposed a new time', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Accept new time', exact: true }).click();
      await page.waitForFunction(() => !document.body.innerText.includes('Doctor proposed a new time'));
      assert.equal(acceptTimeCalled, 1);

      // Check /my-patients error + Retry recovery
      await page.goto(`${BASE_URL}/my-patients`);
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      assert.equal(await page.getByText('No patients yet', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('Zainab Bibi', { exact: true }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);

      assert.deepEqual(pageErrors, []);
      console.log('PASS: customer PENDING_DOCTOR/TIME_PROPOSED bookings, time acceptance, and MyPatients retry');
      await page.close();
    }

    // ── 3. Staff Verification Gate & Visit Execution / Doctor Requests ─────────
    {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      let currentStaff = USERS.STAFF_UNVERIFIED;
      let failVisitsOnce = true;
      let failDoctorRequestsOnce = true;
      let visitState = {
        id: 'visit-101',
        bookingId: 'b-101',
        sequenceNo: 1,
        scheduledStartAt: '2030-05-12T09:00:00Z',
        status: 'ASSIGNED',
        checkInAt: null,
        checkOutAt: null,
        beforeConditionText: null,
        afterConditionText: null,
        visitNotes: null,
        booking: { bookingNumber: 'BK-2026-0101', customerUserId: 'cust-1', patientId: 'p-1', serviceType: { code: 'NURSING' } },
      };
      let docRequests = [
        {
          id: 'b-doc-req-1',
          bookingNumber: 'BK-2026-DOCREQ1',
          status: 'PENDING_DOCTOR',
          requestedStartAt: '2030-05-15T11:00:00Z',
          proposedStartAt: null,
          totalPrice: '4000',
          currency: 'PKR',
          urgencyLevel: 'NORMAL',
          specialInstructions: 'Bring BP cuff',
          patient: { fullName: 'Tariq Mahmood', primaryCondition: 'Post-op care' },
          package: { name: 'Doctor Home Visit' },
          city: { name: 'Lahore' },
        },
      ];

      await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api/v1', '');
        const method = route.request().method();

        if (path === '/auth/refresh') {
          return route.fulfill({ json: { success: true, data: { accessToken: 'staff-token', expiresIn: 900 } } });
        }
        if (path === '/auth/me') {
          return route.fulfill({ json: { success: true, data: currentStaff } });
        }
        if (path === '/visits' && method === 'GET') {
          if (failVisitsOnce) {
            failVisitsOnce = false;
            return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Visits feed unavailable' } } });
          }
          return route.fulfill({ json: { success: true, data: [visitState], meta: { total: 1, page: 1, limit: 50, hasNext: false } } });
        }
        if (path === '/visits/visit-101/en-route' && method === 'PATCH') {
          visitState = { ...visitState, status: 'EN_ROUTE' };
          return route.fulfill({ json: { success: true, data: visitState } });
        }
        if (path === '/visits/visit-101/complete' && method === 'PATCH') {
          visitState = { ...visitState, status: 'COMPLETED' };
          return route.fulfill({ json: { success: true, data: visitState } });
        }
        if (path === '/bookings' && url.searchParams.get('doctorRequestsOnly') === 'true') {
          if (failDoctorRequestsOnce) {
            failDoctorRequestsOnce = false;
            return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Doctor requests unavailable' } } });
          }
          return route.fulfill({ json: { success: true, data: docRequests, meta: { total: docRequests.length, page: 1, limit: 20, hasNext: false } } });
        }
        if (path === '/bookings/b-doc-req-1/doctor-accept' && method === 'PATCH') {
          docRequests = [];
          return route.fulfill({ json: { success: true, data: { id: 'b-doc-req-1', status: 'PENDING' } } });
        }
        return route.fulfill({ json: { success: true, data: [], meta: { total: 0, page: 1, limit: 20, hasNext: false } } });
      });

      // Unverified staff sees StaffVerificationGate on both /staff/visits and /staff/doctor-requests
      await page.goto(`${BASE_URL}/staff/visits`);
      await page.getByText('Awaiting verification', { exact: true }).waitFor();
      await page.goto(`${BASE_URL}/staff/doctor-requests`);
      await page.getByText('Awaiting verification', { exact: true }).waitFor();

      // Switch to verified staff and verify /staff/visits error + Retry + En Route + Complete
      currentStaff = USERS.STAFF_VERIFIED;
      await page.goto(`${BASE_URL}/staff/visits`);
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('BK-2026-0101', { exact: true }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);

      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.getByText('En Route', { exact: true }).nth(1).waitFor();

      // Simulate checked-out visit ready for completion
      visitState = {
        ...visitState,
        status: 'CHECKED_IN',
        checkInAt: '2030-05-12T09:05:00Z',
        checkOutAt: '2030-05-12T09:45:00Z',
      };
      await page.reload();
      await page.getByRole('button', { name: 'Complete', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Complete', exact: true }).click();
      await page.getByText('No visits for this filter', { exact: true }).count(); // ensure no crash

      // Verify /staff/doctor-requests error + Retry (no false empty state) + Accept
      await page.goto(`${BASE_URL}/staff/doctor-requests`);
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      assert.equal(await page.getByText('No pending requests', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('BK-2026-DOCREQ1', { exact: true }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      await page.getByRole('button', { name: 'Accept', exact: true }).click();
      await page.getByText('No pending requests', { exact: true }).waitFor();

      assert.deepEqual(pageErrors, []);
      console.log('PASS: unverified staff gates, verified staff visits lifecycle, and doctor requests retry/accept');
      await page.close();
    }

    // ── 4. Admin Critical Flows (Bookings Tabs, Detail Retry, Newly Invited Staff with null city) ──
    {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      let failBookingDetailOnce = true;
      let failStaffDetailOnce = true;
      let staffVerified = false;
      const staffRows = [
        {
          userId: 'staff-new-1',
          staffCode: 'STF-2026-0099',
          cityId: null,
          zoneId: null,
          gender: null,
          cnic: null,
          experienceYears: 0,
          verificationStatus: 'PENDING',
          verifiedAt: null,
          isAvailable: false,
          createdAt: '2026-05-01T00:00:00Z',
          user: { fullName: 'Newly Invited Nurse', phone: '+923005556677', email: null },
        },
      ];

      await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname.replace('/api/v1', '');
        const method = route.request().method();

        if (path === '/auth/refresh') {
          return route.fulfill({ json: { success: true, data: { accessToken: 'admin-token', expiresIn: 900 } } });
        }
        if (path === '/auth/me') {
          return route.fulfill({ json: { success: true, data: USERS.ADMIN } });
        }
        if (path === '/bookings' && method === 'GET') {
          const st = url.searchParams.get('status');
          const rows =
            st === 'CANCELLED'
              ? [
                  {
                    id: 'b-canc-1',
                    bookingNumber: 'BK-2026-CANC1',
                    status: 'CANCELLED',
                    requestedStartAt: '2030-05-20T10:00:00Z',
                    totalPrice: '2000',
                    currency: 'PKR',
                    urgencyLevel: 'NORMAL',
                    createdAt: '2026-05-01T00:00:00Z',
                    patient: { fullName: 'Cancelled Patient' },
                    serviceType: { code: 'NURSING', name: 'Home Nursing' },
                    package: { name: 'Single Visit' },
                  },
                ]
              : [];
          return route.fulfill({ json: { success: true, data: rows, meta: { total: rows.length, page: 1, limit: 20, hasNext: false } } });
        }
        if (path === '/bookings/b-canc-1' && method === 'GET') {
          if (failBookingDetailOnce) {
            failBookingDetailOnce = false;
            return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Booking detail unavailable' } } });
          }
          return route.fulfill({
            json: {
              success: true,
              data: {
                id: 'b-canc-1',
                bookingNumber: 'BK-2026-CANC1',
                cityId: 'city-1',
                serviceTypeId: 'st-1',
                status: 'CANCELLED',
                requestedStartAt: '2030-05-20T10:00:00Z',
                totalPrice: '2000',
                currency: 'PKR',
                urgencyLevel: 'NORMAL',
                canReschedule: false,
                createdAt: '2026-05-01T00:00:00Z',
                patient: { fullName: 'Cancelled Patient', relationshipToCustomer: 'Self', primaryCondition: null, allergies: null },
                serviceType: { id: 'st-1', code: 'NURSING', name: 'Home Nursing' },
                package: { id: 'pkg-1', name: 'Single Visit' },
                address: { line1: 'Street 1', area: 'Gulberg', contactPhone: '+923001112233' },
                city: { name: 'Lahore' },
                visits: [],
                payments: [],
                reviews: [],
              },
            },
          });
        }
        if (path === '/staff' && method === 'GET') {
          return route.fulfill({ json: { success: true, data: staffRows, meta: { total: staffRows.length, page: 1, limit: 20, hasNext: false } } });
        }
        if (path === '/staff/staff-new-1' && method === 'GET') {
          if (failStaffDetailOnce) {
            failStaffDetailOnce = false;
            return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Staff profile temporarily unavailable' } } });
          }
          return route.fulfill({
            json: {
              success: true,
              data: {
                ...staffRows[0],
                verificationStatus: staffVerified ? 'VERIFIED' : 'PENDING',
                city: null,
                zone: null,
                serviceTypes: [],
              },
            },
          });
        }
        if (path === '/staff/staff-new-1/documents' && method === 'GET') {
          return route.fulfill({ json: { success: true, data: [] } });
        }
        if (path === '/staff/staff-new-1/verify' && method === 'POST') {
          staffVerified = true;
          return route.fulfill({ json: { success: true, data: { userId: 'staff-new-1', verificationStatus: 'VERIFIED' } } });
        }
        return route.fulfill({ json: { success: true, data: [], meta: { total: 0, page: 1, limit: 20, hasNext: false } } });
      });

      // Verify Admin Bookings has Cancelled and Time Proposed tabs
      await page.goto(`${BASE_URL}/admin/bookings`);
      await page.getByRole('button', { name: 'Time Proposed', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Cancelled', exact: true }).click();
      await page.getByText('BK-2026-CANC1', { exact: true }).waitFor();

      // Open AdminBookingDetail: first load fails and shows Retry instead of infinite spinner, second load succeeds
      await page.getByText('BK-2026-CANC1', { exact: true }).click();
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('Cancelled Patient', { exact: true }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);

      // Open Admin Staff list -> click newly invited staff with null city -> error retry -> renders 'City not set' without crashing -> Verify staff
      await page.goto(`${BASE_URL}/admin/staff`);
      await page.getByText('Newly Invited Nurse', { exact: true }).waitFor();
      await page.getByText('Newly Invited Nurse', { exact: true }).click();
      await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      await page.getByText('City not set', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Verify staff', exact: true }).click();
      await page.waitForFunction(() => !document.body.innerText.includes('Verify staff'));
      assert.equal(staffVerified, true);

      assert.deepEqual(pageErrors, []);
      console.log('PASS: admin bookings tabs, booking detail retry, and null-city staff detail + verify');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
