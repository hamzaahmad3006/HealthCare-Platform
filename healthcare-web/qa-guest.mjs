import { chromium } from 'playwright';
import fs from 'fs';

const SHOTS = 'C:\\Users\\hp\\AppData\\Local\\Temp\\qa-guest';
fs.mkdirSync(SHOTS, { recursive: true });
const log = (...a) => console.log('[qa]', ...a);

const FAIL = [];
const PASS = [];
const check = (name, ok, detail = '') => {
  if (ok) { PASS.push(name); log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`); }
  else { FAIL.push(name); log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

async function testRole({ label, phone, password, expectedHome }) {
  log(`\n========== ${label} — GUEST-ROUTE REDIRECTS ==========`);
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  log(`STEP 1: Login as ${label}`);
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('input').first().fill(phone);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  const loginResp = await page.waitForResponse((r) => r.url().includes('/api/v1/auth/login'));
  check(`${label} login API 200`, loginResp.status() === 200);
  await page.waitForURL((url) => url.toString().includes(expectedHome), { timeout: 10000 });

  log(`STEP 2: Hard refresh while authed keeps user signed in (regression)`);
  const beforeRefresh = page.url();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  check(`${label} hard refresh keeps URL`, page.url() === beforeRefresh, `was ${beforeRefresh}, now ${page.url()}`);
  check(`${label} hard refresh not /auth/login`, !page.url().includes('/auth/login'), `at ${page.url()}`);

  log(`STEP 3: Type /auth/login while signed in`);
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-1-auth-login.png`, fullPage: false });
  check(`${label} /auth/login redirects to ${expectedHome}`, page.url().includes(expectedHome) && !page.url().includes('/auth/login'), `at ${page.url()}`);

  log(`STEP 4: Type /auth/register while signed in`);
  await page.goto('http://localhost:5173/auth/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-2-auth-register.png`, fullPage: false });
  check(`${label} /auth/register redirects to ${expectedHome}`, page.url().includes(expectedHome) && !page.url().includes('/auth/register'), `at ${page.url()}`);

  log(`STEP 5: Type / (Landing) while signed in`);
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-3-landing.png`, fullPage: false });
  check(`${label} / redirects to ${expectedHome}`, page.url().includes(expectedHome) && page.url() !== 'http://localhost:5173/', `at ${page.url()}`);

  log(`STEP 6: Logout (clear cookies) — /auth/login must be reachable again`);
  await ctx.clearCookies();
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-4-loggedout.png`, fullPage: false });
  check(`${label} /auth/login reachable after logout`, page.url().includes('/auth/login'), `at ${page.url()}`);

  await browser.close();
}

await testRole({ label: 'admin', phone: '3001234567', password: 'Admin@1234', expectedHome: '/admin' });
log('\n--- waiting 70s for auth rate-limit window to reset ---');
await new Promise(r => setTimeout(r, 70000));
await testRole({ label: 'staff', phone: '3226075306', password: 'Staff@1234', expectedHome: '/complete-profile' });

log('\n========== SUMMARY ==========');
log(`PASSED: ${PASS.length}`);
log(`FAILED: ${FAIL.length}`);
if (FAIL.length) {
  log('FAILURES:');
  FAIL.forEach(f => log(`  - ${f}`));
  process.exit(1);
}
