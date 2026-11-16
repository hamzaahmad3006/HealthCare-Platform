import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const SITE_BASE_URL = 'https://homehealth.pk';
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const SERVICES = [
  {
    slug: 'nursing',
    code: 'NURSING',
    name: 'Home Nursing Care Services',
    shortName: 'Home Nursing',
    price: 1500,
    priceLabel: 'From PKR 1,500 / visit',
    badge: 'PNC Licensed Nurses',
    description:
      'Book PNC-licensed male & female home nurses for post-surgical wound dressing, IV cannula & drip administration, injections, catheter care, and vital signs monitoring.',
  },
  {
    slug: 'visiting-doctor',
    code: 'VISITING_DOCTOR',
    name: 'Visiting Doctor at Home',
    shortName: 'Visiting Doctor',
    price: 2500,
    priceLabel: 'From PKR 2,500 / visit',
    badge: 'PMDC Verified Physicians',
    description:
      'Schedule a PMDC-registered general physician or specialist for a thorough home medical checkup, acute illness diagnosis, chronic disease management, and digital prescription.',
  },
  {
    slug: 'lab-sampling',
    code: 'LAB_SAMPLING',
    name: 'Home Lab Sample Collection & Blood Tests',
    shortName: 'Lab Sampling',
    price: 500,
    priceLabel: 'From PKR 500 + lab test fee',
    badge: 'ISO Accredited Partner Labs',
    description:
      'Book certified phlebotomists for home blood sample collection. Partnered with ISO-accredited pathology labs with fast digital PDF reports delivered online.',
  },
  {
    slug: 'physiotherapy',
    code: 'PHYSIOTHERAPY',
    name: 'Home Physiotherapy & Rehabilitation',
    shortName: 'Physiotherapy',
    price: 2000,
    priceLabel: 'From PKR 2,000 / session',
    badge: 'DPT Certified Therapists',
    description:
      'Book qualified male & female DPT physiotherapists at home for stroke rehabilitation, post-knee/hip replacement recovery, back pain, frozen shoulder, and mobility therapy.',
  },
  {
    slug: 'caregiver',
    code: 'CAREGIVER',
    name: 'Trained Home Caregiver & Patient Attendant',
    shortName: 'Caregiver Support',
    price: 1800,
    priceLabel: 'From PKR 1,800 / shift',
    badge: 'CNIC & Police Verified',
    description:
      'Hire background-checked 12-hour or 24-hour home caregivers and patient attendants for elderly parents, bedridden patients, dementia support, and daily living assistance.',
  },
  {
    slug: 'ambulance',
    code: 'AMBULANCE',
    name: 'Patient Transport & Ambulance Service',
    shortName: 'Ambulance Service',
    price: 3500,
    priceLabel: 'From PKR 3,500 / trip',
    badge: 'Paramedic Equipped',
    description:
      'Book air-conditioned, oxygen-equipped ambulances with trained paramedics for safe hospital-to-home discharges, diagnostic center transfers, and inter-city patient transport.',
  },
];

const CITIES = [
  {
    slug: 'faisalabad',
    name: 'Faisalabad',
    province: 'Punjab',
    eta: '45–60 mins',
    lat: '31.4504',
    lng: '73.1350',
    zones: [
      'Peoples Colony No. 1 & 2',
      'Madina Town & Susan Road',
      'Gulberg & Jinnah Colony',
      'Kohinoor City & D Ground',
      'Canal Road & Eden Valley',
      'Civil Lines & Millat Town',
    ],
  },
  {
    slug: 'lahore',
    name: 'Lahore',
    province: 'Punjab',
    eta: '45–60 mins',
    lat: '31.5204',
    lng: '74.3587',
    zones: ['DHA Phases 1–8', 'Gulberg', 'Johar Town', 'Model Town', 'Bahria Town', 'Lahore Cantt'],
  },
  {
    slug: 'islamabad',
    name: 'Islamabad',
    province: 'Islamabad Capital Territory',
    eta: '45–60 mins',
    lat: '33.6844',
    lng: '73.0479',
    zones: ['F-6, F-7, F-8, F-10, F-11', 'G-8, G-9, G-10, G-11', 'E-11 & D-12', 'DHA & Bahria Enclave'],
  },
  {
    slug: 'rawalpindi',
    name: 'Rawalpindi',
    province: 'Punjab',
    eta: '45–60 mins',
    lat: '33.5651',
    lng: '73.0169',
    zones: ['Bahria Town Phases 1–8', 'Chaklala Scheme 3', 'Satellite Town', 'Saddar & Peshawar Road'],
  },
  {
    slug: 'multan',
    name: 'Multan',
    province: 'Punjab',
    eta: '45–60 mins',
    lat: '30.1575',
    lng: '71.5249',
    zones: ['Multan Cantt', 'Gulgasht Colony', 'Bosan Road', 'Model Town & Buch Villas', 'Wapda Town'],
  },
  {
    slug: 'gujranwala',
    name: 'Gujranwala',
    province: 'Punjab',
    eta: '45–60 mins',
    lat: '32.1877',
    lng: '74.1945',
    zones: ['Citi Housing', 'Wapda Town', 'Model Town', 'Satellite Town', 'Gujranwala Cantt'],
  },
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRouteSpecs() {
  const routes = [];

  // 1. Root homepage
  routes.push({
    routePath: '/',
    priority: '1.0',
    changefreq: 'daily',
    title: 'HomeHealth Pakistan — Hospital-Grade Home Nursing, Visiting Doctors & Lab Tests',
    description:
      'Book PNC-verified home nurses, PMDC visiting doctors, bedside blood tests, physiotherapy, and patient attendants in Faisalabad, Lahore, Islamabad & across Pakistan.',
    h1: 'Hospital-Grade Healthcare, Right At Your Doorstep.',
    city: CITIES[0],
    service: null,
  });

  // 2. /services directory
  routes.push({
    routePath: '/services',
    priority: '0.9',
    changefreq: 'weekly',
    title: 'At-Home Healthcare Services & City Directory | HomeHealth Pakistan',
    description:
      'Explore PNC-verified home nursing, PMDC visiting doctors, bedside blood sample collection, physiotherapy, caregivers, and ambulance services across Pakistan.',
    h1: 'Hospital-Grade Home Healthcare Services Across Pakistan',
    city: CITIES[0],
    service: null,
  });

  // 3. /services/:serviceSlug
  for (const svc of SERVICES) {
    routes.push({
      routePath: `/services/${svc.slug}`,
      priority: '0.85',
      changefreq: 'weekly',
      title: `${svc.name} in Pakistan — Verified At-Home Care | HomeHealth`,
      description: `${svc.description} Available across Faisalabad, Lahore, Islamabad, Rawalpindi, Multan & Gujranwala.`,
      h1: `${svc.name} in Faisalabad`,
      city: CITIES[0],
      service: svc,
    });

    // 4. /services/:serviceSlug/:citySlug
    for (const city of CITIES) {
      routes.push({
        routePath: `/services/${svc.slug}/${city.slug}`,
        priority: city.slug === 'faisalabad' ? '0.90' : '0.80',
        changefreq: 'weekly',
        title: `${svc.name} in ${city.name} (${svc.priceLabel}) | HomeHealth Pakistan`,
        description: `Book ${svc.name.toLowerCase()} in ${city.name} (${city.zones.slice(0, 3).join(', ')}). ${svc.description} Arrival in ${city.eta}. Pay after care.`,
        h1: `${svc.name} in ${city.name}`,
        city,
        service: svc,
      });
    }
  }

  // 5. /locations/:citySlug
  for (const city of CITIES) {
    routes.push({
      routePath: `/locations/${city.slug}`,
      priority: city.slug === 'faisalabad' ? '0.90' : '0.80',
      changefreq: 'weekly',
      title: `Home Healthcare, Nursing & Visiting Doctors in ${city.name} | HomeHealth Pakistan`,
      description: `Book verified home nurses, PMDC visiting doctors, bedside blood tests, and physiotherapy in ${city.name} (${city.zones.slice(0, 4).join(', ')}). Arrival in ${city.eta}.`,
      h1: `Verified Home Healthcare & Nursing Services in ${city.name}`,
      city,
      service: null,
    });
  }

  return routes;
}

function buildPrerenderedBodyHtml(spec) {
  const { h1, description, service, city } = spec;
  const serviceLinks = SERVICES.map(
    (s) =>
      `<li><a href="/services/${s.slug}/${city.slug}">${escapeHtml(s.name)} in ${escapeHtml(city.name)} (${escapeHtml(s.priceLabel)})</a></li>`,
  ).join('');
  const cityLinks = CITIES.map(
    (c) =>
      `<li><a href="${service ? `/services/${service.slug}/${c.slug}` : `/locations/${c.slug}`}">${escapeHtml(service ? `${service.shortName} in ${c.name}` : `Home Healthcare in ${c.name}`)}</a></li>`,
  ).join('');
  const zoneItems = city.zones.map((z) => `<li>${escapeHtml(z)}</li>`).join('');

  return `<main class="max-w-7xl mx-auto px-6 py-12" data-ssg-prerendered="true">
    <header>
      <p>${escapeHtml(service ? service.badge : 'PNC & PMDC Verified Home Healthcare')}</p>
      <h1>${escapeHtml(h1)}</h1>
      <p>${escapeHtml(description)}</p>
      ${service ? `<p><strong>Starting Rate:</strong> ${escapeHtml(service.priceLabel)} · <strong>Doorstep ETA:</strong> ${escapeHtml(city.eta)} · <strong>Payment:</strong> Pay After Care</p>` : ''}
      <p><a href="/book${service ? `?service=${service.code}&city=${encodeURIComponent(city.name)}` : ''}">Book Appointment Online</a> | <a href="/services">All Services</a></p>
    </header>
    <section>
      <h2>Areas Covered in ${escapeHtml(city.name)}</h2>
      <ul>${zoneItems}</ul>
    </section>
    <section>
      <h2>Available Home Healthcare Services in ${escapeHtml(city.name)}</h2>
      <ul>${serviceLinks}</ul>
    </section>
    <section>
      <h2>City Coverage Across Pakistan</h2>
      <ul>${cityLinks}</ul>
    </section>
  </main>`;
}

function renderHtmlForRoute(baseHtml, spec) {
  const fullUrl = `${SITE_BASE_URL}${spec.routePath === '/' ? '' : spec.routePath}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': spec.service ? 'MedicalBusiness' : 'MedicalOrganization',
    name: spec.title,
    description: spec.description,
    url: fullUrl,
    telephone: '+92-300-1234567',
    address: {
      '@type': 'PostalAddress',
      addressLocality: spec.city.name,
      addressRegion: spec.city.province,
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: spec.city.lat,
      longitude: spec.city.lng,
    },
    ...(spec.service
      ? {
          priceRange: spec.service.priceLabel,
          makesOffer: {
            '@type': 'Offer',
            priceCurrency: 'PKR',
            price: String(spec.service.price),
          },
        }
      : {}),
  };

  let html = baseHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(spec.title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(spec.description)}" />`,
  );

  // Replace OG tags
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(spec.title)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(spec.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(spec.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(spec.description)}" />`,
  );

  // Inject canonical, robots, geo, og:url, and JSON-LD before </head>
  const extraHead = `    <link rel="canonical" href="${escapeHtml(fullUrl)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <meta property="og:url" content="${escapeHtml(fullUrl)}" />
    <meta name="geo.region" content="PK-PB" />
    <meta name="geo.placename" content="${escapeHtml(spec.city.name)}, Pakistan" />
    <meta name="geo.position" content="${spec.city.lat};${spec.city.lng}" />
    <script type="application/ld+json" data-seo-jsonld="ssg">${JSON.stringify(jsonLd)}</script>
  </head>`;

  html = html.replace(/<\/head>/i, extraHead);

  // Inject pre-rendered semantic HTML into <div id="root"></div>
  const bodyContent = buildPrerenderedBodyHtml(spec);
  html = html.replace(
    /<div id="root"><\/div>/i,
    `<div id="root">${bodyContent}</div>`,
  );

  return html;
}

function generateSitemapXml(routes) {
  const urlEntries = routes
    .map((r) => {
      const loc = `${SITE_BASE_URL}${r.routePath === '/' ? '' : r.routePath}`;
      return `  <url>
    <loc>${escapeHtml(loc)}</loc>
    <lastmod>${TODAY_ISO}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Allow: /services
Allow: /services/
Allow: /locations/
Disallow: /admin
Disallow: /admin/
Disallow: /staff
Disallow: /staff/
Disallow: /my-bookings
Disallow: /my-reports
Disallow: /my-patients
Disallow: /my-account
Disallow: /complete-profile

Sitemap: ${SITE_BASE_URL}/sitemap.xml
`;
}

function main() {
  const routes = buildRouteSpecs();
  const sitemapXml = generateSitemapXml(routes);
  const robotsTxt = generateRobotsTxt();

  // Always write sitemap.xml and robots.txt to public/ so dev server serves them too
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt, 'utf8');

  if (!fs.existsSync(DIST_DIR)) {
    console.log('[prerender-seo] Generated public/sitemap.xml and public/robots.txt (dist/ not built yet).');
    return;
  }

  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`[prerender-seo] Missing ${templatePath}. Run vite build first.`);
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf8');

  let count = 0;
  for (const spec of routes) {
    const renderedHtml = renderHtmlForRoute(baseHtml, spec);
    const outPath =
      spec.routePath === '/'
        ? path.join(DIST_DIR, 'index.html')
        : path.join(DIST_DIR, ...spec.routePath.split('/').filter(Boolean), 'index.html');

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, renderedHtml, 'utf8');
    count += 1;
  }

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

  console.log(
    `✓ [prerender-seo] Pre-rendered ${count} static SEO HTML pages + sitemap.xml + robots.txt in dist/`,
  );
}

main();
