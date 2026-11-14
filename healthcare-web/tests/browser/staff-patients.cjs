// Run against the local web preview with Playwright and Chromium installed.
// All API calls use synthetic fixtures; no database or notifications are used.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const attempts = new Map();
    let empty = false;
    await page.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace('/api/v1', '');
      if (path === '/auth/refresh') return route.fulfill({ json: { success: true, data: { accessToken: 'test-only', expiresIn: 900 } } });
      if (path === '/auth/me') return route.fulfill({ json: { success: true, data: { id: 'staff', role: 'STAFF', fullName: 'Test Staff', staffVerificationStatus: 'VERIFIED' } } });
      if (path === '/users/patients') {
        const number = Number(url.searchParams.get('page'));
        assert.equal(url.searchParams.get('limit'), '20');
        attempts.set(number, (attempts.get(number) ?? 0) + 1);
        if (attempts.get(number) === 1) return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Patients temporarily unavailable' } } });
        return route.fulfill({ json: { success: true, data: empty ? [] : [{ id: `patient-${number}`, fullName: `Patient on page ${number}`, createdAt: '2026-01-01T00:00:00Z' }], meta: { total: empty ? 0 : 21, page: number, limit: 20, hasNext: !empty && number === 1 } } });
      }
      return route.fulfill({ json: { success: true, data: [] } });
    });
    const base = process.env.WEB_TEST_URL ?? 'http://127.0.0.1:5174';
    await page.goto(`${base}/staff/patients`);
    await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
    assert.equal(await page.getByText('No patients yet', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByText('Patient on page 1', { exact: true }).waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
    assert.equal(await page.getByText('Patient on page 1', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.getByText('Patient on page 2', { exact: true }).waitFor();
    assert.equal(attempts.get(2), 2);
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.getByRole('button', { name: 'Prev', exact: true }).click();
    await page.getByText('Patient on page 1', { exact: true }).waitFor();
    empty = true;
    await page.reload();
    await page.getByText('No patients yet', { exact: true }).waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: first-page retry, failed-page retry, cleared errors, pagination and genuine empty state');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
