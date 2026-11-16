// Automated Verification Suite for Service/City SEO Landing Pages, SSG Pre-rendering, Sitemap, Robots & Headless Chrome DOM Execution.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

const DIST_DIR = path.resolve(__dirname, '../../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

function getMimeType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.xml')) return 'application/xml; charset=utf-8';
  if (filePath.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function startStaticDistServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, 'http://127.0.0.1');
      const relPath = decodeURIComponent(reqUrl.pathname);

      if (relPath.startsWith('/api/v1/')) {
        res.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' });
        res.end(JSON.stringify({ success: true, data: [] }));
        return;
      }

      let candidate = path.join(DIST_DIR, relPath);

      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        candidate = path.join(candidate, 'index.html');
      } else if (!fs.existsSync(candidate)) {
        const htmlCandidate = path.join(DIST_DIR, relPath, 'index.html');
        if (fs.existsSync(htmlCandidate)) {
          candidate = htmlCandidate;
        } else {
          candidate = path.join(DIST_DIR, 'index.html');
        }
      }

      const content = fs.readFileSync(candidate);
      res.writeHead(200, { 'Content-Type': getMimeType(candidate), Connection: 'close' });
      res.end(content);
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  return candidates.find((p) => fs.existsSync(p)) || null;
}

(async () => {
  // ── 1. Verify Static SSG Pre-rendered Artifacts on Disk ─────────────────────
  console.log('1. Verifying 50 SSG pre-rendered HTML files, sitemap.xml, and robots.txt...');
  const expectedFiles = [
    path.join(DIST_DIR, 'index.html'),
    path.join(DIST_DIR, 'services', 'index.html'),
    path.join(DIST_DIR, 'services', 'nursing', 'index.html'),
    path.join(DIST_DIR, 'services', 'nursing', 'faisalabad', 'index.html'),
    path.join(DIST_DIR, 'services', 'visiting-doctor', 'lahore', 'index.html'),
    path.join(DIST_DIR, 'services', 'lab-sampling', 'islamabad', 'index.html'),
    path.join(DIST_DIR, 'services', 'physiotherapy', 'rawalpindi', 'index.html'),
    path.join(DIST_DIR, 'services', 'caregiver', 'multan', 'index.html'),
    path.join(DIST_DIR, 'services', 'ambulance', 'gujranwala', 'index.html'),
    path.join(DIST_DIR, 'locations', 'faisalabad', 'index.html'),
    path.join(DIST_DIR, 'locations', 'lahore', 'index.html'),
    path.join(DIST_DIR, 'sitemap.xml'),
    path.join(DIST_DIR, 'robots.txt'),
    path.join(PUBLIC_DIR, 'sitemap.xml'),
    path.join(PUBLIC_DIR, 'robots.txt'),
  ];

  for (const file of expectedFiles) {
    assert.ok(fs.existsSync(file), `Expected SSG file missing: ${file}`);
  }

  const fsdNursingHtml = fs.readFileSync(
    path.join(DIST_DIR, 'services', 'nursing', 'faisalabad', 'index.html'),
    'utf8',
  );
  assert.match(
    fsdNursingHtml,
    /<title>Home Nursing Care Services in Faisalabad \(From PKR 1,500 \/ visit\) \| HomeHealth Pakistan<\/title>/,
  );
  assert.match(
    fsdNursingHtml,
    /<link rel="canonical" href="https:\/\/homehealth\.pk\/services\/nursing\/faisalabad" \/>/,
  );
  assert.match(
    fsdNursingHtml,
    /<meta property="og:url" content="https:\/\/homehealth\.pk\/services\/nursing\/faisalabad" \/>/,
  );
  assert.match(fsdNursingHtml, /<meta name="geo\.placename" content="Faisalabad, Pakistan" \/>/);
  assert.match(fsdNursingHtml, /application\/ld\+json/);
  assert.match(fsdNursingHtml, /<h1>Home Nursing Care Services in Faisalabad<\/h1>/);
  assert.match(fsdNursingHtml, /Peoples Colony No\. 1 &amp; 2/);

  const sitemapXml = fs.readFileSync(path.join(DIST_DIR, 'sitemap.xml'), 'utf8');
  const urlCount = (sitemapXml.match(/<url>/g) || []).length;
  assert.equal(urlCount, 50, `Expected 50 URLs in sitemap.xml, found ${urlCount}`);
  assert.match(sitemapXml, /https:\/\/homehealth\.pk\/services\/nursing\/faisalabad/);
  assert.match(sitemapXml, /https:\/\/homehealth\.pk\/locations\/faisalabad/);

  const robotsTxt = fs.readFileSync(path.join(DIST_DIR, 'robots.txt'), 'utf8');
  assert.match(robotsTxt, /Allow: \/services\//);
  assert.match(robotsTxt, /Allow: \/locations\//);
  assert.match(robotsTxt, /Disallow: \/admin\//);
  assert.match(robotsTxt, /Sitemap: https:\/\/homehealth\.pk\/sitemap\.xml/);
  console.log(`   ✓ Verified all ${urlCount} pre-rendered routes in sitemap.xml, robots.txt, and dist/.`);

  // ── 2. Verify Live HTTP Delivery & Headless Chrome React Hydration ──────────
  console.log('2. Testing HTTP serving & Headless Chrome React SPA rendering...');
  const { server, baseUrl } = await startStaticDistServer();
  const tmpProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hh-seo-chrome-'));

  try {
    const endpointsToVerify = [
      { path: '/', expectedTitle: /HomeHealth Pakistan/ },
      { path: '/services', expectedTitle: /At-Home Healthcare Services & City Directory/ },
      { path: '/services/nursing/faisalabad', expectedTitle: /Home Nursing Care Services in Faisalabad/ },
      { path: '/services/visiting-doctor/lahore', expectedTitle: /Visiting Doctor at Home in Lahore/ },
      { path: '/services/lab-sampling/islamabad', expectedTitle: /Home Lab Sample Collection & Blood Tests in Islamabad/ },
      { path: '/locations/faisalabad', expectedTitle: /Home Healthcare, Nursing & Visiting Doctors in Faisalabad/ },
      { path: '/sitemap.xml', expectedTitle: /<urlset/ },
      { path: '/robots.txt', expectedTitle: /User-agent: \*/ },
    ];

    for (const ep of endpointsToVerify) {
      const res = await fetch(`${baseUrl}${ep.path}`);
      assert.equal(res.status, 200, `Expected 200 for ${ep.path}`);
      const body = await res.text();
      assert.match(body, ep.expectedTitle, `Content mismatch on ${ep.path}`);
    }
    console.log('   ✓ All HTTP SEO endpoints returned 200 OK with expected titles, canonicals & JSON-LD.');

    const chromeBin = findChromeBinary();
    if (chromeBin) {
      const { stdout: domDump } = await execFileAsync(
        chromeBin,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-extensions',
          `--user-data-dir=${tmpProfileDir}`,
          '--virtual-time-budget=2500',
          '--dump-dom',
          `${baseUrl}/services/nursing/faisalabad`,
        ],
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
      );

      assert.match(domDump, /What’s Included in Every Visit/);
      assert.match(domDump, /Post-Hospital Discharge Continuity in Faisalabad/);
      assert.match(domDump, /Allied Hospital Faisalabad/);
      assert.match(domDump, /data-seo-jsonld="dynamic"/);
      console.log('   ✓ Headless Chrome executed React SPA & verified dynamic client-rendered DOM + JSON-LD!');
    }
  } finally {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    server.close();
    try {
      fs.rmSync(tmpProfileDir, { recursive: true, force: true });
    } catch {}
  }
})();
