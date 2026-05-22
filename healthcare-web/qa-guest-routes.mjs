import { chromium } from 'playwright';
import fs from 'fs';

const SHOTS = 'C:\\Users\\hp\\AppData\\Local\\Temp\\qa-guest-routes';
fs.mkdirSync(SHOTS, { recursive: true });
const log = (...a) => console.log('[guest-qa]', ...a);

const FAIL = [];
const PASS = [];
const check = (name, ok, detail = '') => {
  if (ok) { PASS.push(name); log(`  ✓ ${name}${detail ? ' — ' + detail : ''}`); }
  else { FAIL.push(name); log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

async function testRole({ label, phone, password, expectedDashboardURL }) {
  log(`\n========== ${label} — GUEST-ROUTE GATING ==========`);
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // ── 1. LOGIN ─────────────────────────────────────────────────────────────
  log(`STEP 1: Login as ${label}`);
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.locator('input').first().fill(phone);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  const loginResp = await page.waitForResponse((r) => r.url().includes('/api/v1/auth/login'));
  check(`${label} login OK`, loginResp.status() === 200, `got ${loginResp.status()}`);
  await page.waitForTimeout(2500);

  // ── 2. Try to visit /login directly while authenticated ──────────────────
  log(`STEP 2: Type /login into address bar while logged in`);
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-1-tried-login.png`, fullPage: false });
  check(`${label} /login redirects away`, !page.url().endsWith('/login'), `at ${page.url()}`);
  check(`${label} /login redirects to ${expectedDashboardURL}`, page.url().includes(expectedDashboardURL), `at ${page.url()}`);

  // ── 3. Try /register while authenticated ─────────────────────────────────
  log(`STEP 3: Type /register into address bar while logged in`);
  await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-2-tried-register.png`, fullPage: false });
  check(`${label} /register redirects away`, !page.url().endsWith('/register'), `at ${page.url()}`);

  // ── 4. Try / (Landing) while authenticated ───────────────────────────────
  log(`STEP 4: Type / (Landing) into address bar while logged in`);
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-3-tried-landing.png`, fullPage: false });
  check(`${label} / (Landing) redirects away`, page.url() !== 'http://localhost:5173/', `at ${page.url()}`);
  check(`${label} / redirects to ${expectedDashboardURL}`, page.url().includes(expectedDashboardURL), `at ${page.url()}`);

  // ── 5. Regression: /login still works for an UNAUTHENTICATED user ────────
  log(`STEP 5: Log out and verify /login is reachable again`);
  // Hard "log out" by clearing cookies + reloading
  await ctx.clearCookies();
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${SHOTS}\\${label}-4-loggedout-login.png`, fullPage: false });
  check(`${label} /login reachable after logout`, page.url().endsWith('/login'), `at ${page.url()}`);

  await browser.close();
}

await testRole({ label: 'admin', phone: '3001234567', password: 'Admin@1234', expectedDashboardURL: '/admin' });
log('\n--- waiting 70s for auth rate-limit window to reset ---');
await new Promise(r => setTimeout(r, 70000));
// staff with incomplete profile gets sent to /complete-profile, which is
// still NOT one of the guest routes — counts as "redirected away"
await testRole({ label: 'staff', phone: '3226075306', password: 'Staff@1234', expectedDashboardURL: '/complete-profile' });

log('\n========== SUMMARY ==========');
log(`PASSED: ${PASS.length}`);
log(`FAILED: ${FAIL.length}`);
if (FAIL.length) {
  log('FAILURES:');
  FAIL.forEach(f => log(`  - ${f}`));
  process.exit(1);
}
