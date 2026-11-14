// Run with local preview and Playwright. All API calls are synthetic fixtures.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    const page = await browser.newPage();
    const requests = [];
    const id = '00000000-0000-4000-8000-000000000001';
    await page.route('**/api/v1/**', async route => {
      const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
      if (path === '/auth/refresh') return route.fulfill({ json: { data: { accessToken: 'test-only', expiresIn: 900 } } });
      if (path === '/auth/me') return route.fulfill({ json: { data: { id: 'customer', role: 'CUSTOMER', fullName: 'Test Customer' } } });
      if (path === '/service-types') return route.fulfill({ json: { data: [{ id, code: 'NURSING', name: 'Test Nursing', isActive: true }] } });
      if (path === '/packages') return route.fulfill({ json: { data: [{ id, serviceTypeId: id, name: 'Test Package', packageType: 'PER_VISIT', priceAmount: 100, currency: 'PKR', visitCount: 1, durationDays: 1, isActive: true }] } });
      if (path === '/users/patients') return route.fulfill({ json: { data: [{ id, fullName: 'Test Patient' }] } });
      if (path === '/users/addresses') return route.fulfill({ json: { data: [{ id, cityId: id, line1: 'Test Street', area: 'Test Area', contactPhone: '+10000000000' }] } });
      if (path === '/bookings' && route.request().method() === 'POST') {
        requests.push({ key: route.request().headers()['x-idempotency-key'], body: route.request().postDataJSON() });
        return route.fulfill({ status: 503, json: { success: false, error: { code: 'TEST', message: 'Test retry failure' } } });
      }
      return route.fulfill({ json: { data: [] } });
    });
    await page.goto(`${process.env.WEB_TEST_URL ?? 'http://127.0.0.1:5174'}/book`);
    await page.getByRole('button', { name: 'Test Nursing', exact: true }).click();
    await page.getByRole('button', { name: /Test Package/ }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: /Test Patient/ }).click();
    await page.getByRole('button', { name: /Test Street/ }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.locator('input[type=date]').fill('2035-01-01');
    await page.locator('input[type=time]').fill('12:00');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
    await page.getByText('Test retry failure', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
    await page.getByText('Test retry failure', { exact: true }).waitFor();
    assert.equal(requests.length, 2);
    assert.ok(requests[0].key);
    assert.deepEqual(requests[0], requests[1]);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.locator('input[type=time]').fill('13:00');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
    await page.getByText('Test retry failure', { exact: true }).waitFor();
    assert.equal(requests.length, 3);
    assert.notEqual(requests[2].key, requests[0].key);
    assert.notEqual(requests[2].body.requestedStartAt, requests[0].body.requestedStartAt);
    console.log('PASS: web retries keep identity; changed booking details receive a new key');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
