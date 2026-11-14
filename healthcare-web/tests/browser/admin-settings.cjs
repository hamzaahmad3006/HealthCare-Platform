// Synthetic API fixtures only. Requires a local web preview and Playwright.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    for (const [tab, endpoint, add, emptyText] of [
      ['Service Types', 'service-types', 'Add Service Type', 'No service types yet.'],
      ['Packages', 'packages', 'Add Package', 'No packages yet.'],
      ['Cities & Zones', 'cities', 'Add City', 'No cities yet.'],
    ]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let failing = true;
      let mutations = 0;
      await page.route('**/api/v1/**', async route => {
        const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
        if (path === '/auth/refresh') return route.fulfill({ json: { success: true, data: { accessToken: 'test-only', expiresIn: 900 } } });
        if (path === '/auth/me') return route.fulfill({ json: { success: true, data: { id: 'admin', role: 'ADMIN', fullName: 'Test Admin' } } });
        if (path.startsWith('/admin/settings/') && route.request().method() !== 'GET') mutations++;
        if (path === `/admin/settings/${endpoint}` && failing) return route.fulfill({ status: 503, json: { success: false, error: { code: 'UNAVAILABLE', message: 'Settings temporarily unavailable' } } });
        return route.fulfill({ json: { success: true, data: [] } });
      });
      await page.goto(`${process.env.WEB_TEST_URL ?? 'http://127.0.0.1:5174'}/admin/settings`);
      await page.getByRole('button', { name: tab, exact: true }).click();
      await page.getByRole('button', { name: 'Retry loading settings', exact: true }).waitFor();
      assert.equal(await page.getByText(emptyText, { exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: add, exact: true }).isDisabled(), true);
      // A repeated failed retry must keep the persistent error state.
      await page.getByRole('button', { name: 'Retry loading settings', exact: true }).click();
      await page.getByRole('button', { name: 'Retry loading settings', exact: true }).waitFor();
      failing = false;
      await page.getByRole('button', { name: 'Retry loading settings', exact: true }).click();
      await page.getByText(emptyText, { exact: true }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      assert.equal(await page.getByRole('button', { name: add, exact: true }).isEnabled(), true);
      assert.equal(mutations, 0);
      assert.deepEqual(errors, []);
      console.log(`PASS: ${tab} failure, repeated retry, recovered empty state and enabled create action`);
      await page.close();
    }
    // An older failed filter request must not replace the latest successful view.
    const page = await browser.newPage();
    let releaseOld;
    let oldStarted;
    const oldRequest = new Promise(resolve => { oldStarted = resolve; });
    await page.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      const path = url.pathname.replace('/api/v1', '');
      if (path === '/auth/refresh') return route.fulfill({ json: { success: true, data: { accessToken: 'test-only', expiresIn: 900 } } });
      if (path === '/auth/me') return route.fulfill({ json: { success: true, data: { id: 'admin', role: 'ADMIN', fullName: 'Test Admin' } } });
      if (path === '/admin/settings/service-types') return route.fulfill({ json: { data: ['a', 'b'].map(id => ({ id, name: `Service ${id}`, code: id, isActive: true })) } });
      if (path === '/admin/settings/packages' && url.searchParams.get('serviceTypeId') === 'a') {
        releaseOld = () => route.fulfill({ status: 503, json: { error: { message: 'Old request failed' } } });
        oldStarted();
        return;
      }
      if (path === '/admin/settings/packages' && url.searchParams.get('serviceTypeId') === 'b') return route.fulfill({ json: { data: [{ id: 'current', name: 'Current package', packageType: 'PER_VISIT', priceAmount: 100, currency: 'PKR', visitCount: 1, durationDays: 1, isActive: true }] } });
      return route.fulfill({ json: { data: [] } });
    });
    await page.goto(`${process.env.WEB_TEST_URL ?? 'http://127.0.0.1:5174'}/admin/settings`);
    await page.getByRole('button', { name: 'Packages', exact: true }).click();
    await page.getByText('No packages yet.', { exact: true }).waitFor();
    await page.getByRole('combobox').selectOption('a');
    await oldRequest;
    await page.getByRole('combobox').selectOption('b');
    await page.getByText('Current package', { exact: true }).waitFor();
    await releaseOld();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('alert').count(), 0);
    assert.equal(await page.getByText('Current package', { exact: true }).isVisible(), true);
    console.log('PASS: a stale package-filter failure does not replace the latest results');
    await page.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
