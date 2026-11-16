import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  BadgeCheck,
  Star,
  Stethoscope,
  HandHeart,
  TestTube2,
  UserSquare2,
  Activity,
  Siren,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building2,
  Check,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { TopNav } from '../../../component/common/TopNav';
import { BrandLogo } from '../../../component/common/BrandLogo';
import { SeoHead } from '../../../component/common/SeoHead';
import { Button } from '../../../constant/Button';
import { Badge } from '../../../constant/Badge';
import {
  SEO_SERVICES,
  SEO_CITIES,
  SITE_BASE_URL,
  findSeoService,
  findSeoCity,
  type SeoServiceSpec,
  type SeoCitySpec,
} from '../../../constant/seoCatalog';
import { NotFound } from '../../NotFound/NotFound';

const SERVICE_ICON: Record<string, JSX.Element> = {
  NURSING: <Stethoscope className="h-6 w-6" />,
  CAREGIVER: <HandHeart className="h-6 w-6" />,
  LAB_SAMPLING: <TestTube2 className="h-6 w-6" />,
  VISITING_DOCTOR: <UserSquare2 className="h-6 w-6" />,
  PHYSIOTHERAPY: <Activity className="h-6 w-6" />,
  AMBULANCE: <Siren className="h-6 w-6" />,
};

export function ServiceCityLanding(): JSX.Element {
  const { serviceSlug, citySlug } = useParams<{ serviceSlug?: string; citySlug?: string }>();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const service = serviceSlug ? findSeoService(serviceSlug) : undefined;
  const city = citySlug ? findSeoCity(citySlug) : undefined;

  // Validate route parameters against known catalog
  if (serviceSlug && !service) {
    return <NotFound />;
  }
  if (citySlug && !city) {
    return <NotFound />;
  }

  const activeCity: SeoCitySpec = city ?? SEO_CITIES[0]!;

  const handleBookNow = (svcCode?: string, targetCityName?: string): void => {
    const params = new URLSearchParams();
    if (svcCode) params.set('service', svcCode);
    if (targetCityName) params.set('city', targetCityName);
    const qs = params.toString();
    navigate(qs ? `/book?${qs}` : '/book');
  };

  const handleWhatsApp = (contextText?: string): void => {
    const rawPhone =
      (import.meta.env['VITE_WHATSAPP_NUMBER'] as string | undefined) ?? '+923001234567';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const msg = contextText
      ? `?text=${encodeURIComponent(contextText)}`
      : '';
    window.open(`https://wa.me/${cleanPhone}${msg}`, '_blank');
  };

  // Case 1: /services (All Services & Cities Directory Hub)
  if (!service && !city) {
    return (
      <ServicesDirectoryView
        onBook={handleBookNow}
        onWhatsApp={handleWhatsApp}
      />
    );
  }

  // Case 2: /locations/:citySlug (City Healthcare Hub)
  if (!service && city) {
    return (
      <CityHubView
        city={city}
        onBook={handleBookNow}
        onWhatsApp={handleWhatsApp}
      />
    );
  }

  // Case 3: /services/:serviceSlug or /services/:serviceSlug/:citySlug
  const resolvedService = service!;
  const isCityScoped = Boolean(city);
  const canonicalPath = isCityScoped
    ? `/services/${resolvedService.slug}/${activeCity.slug}`
    : `/services/${resolvedService.slug}`;

  const pageTitle = isCityScoped
    ? `${resolvedService.name} in ${activeCity.name} (${resolvedService.priceLabel}) | HomeHealth Pakistan`
    : `${resolvedService.name} in Pakistan — Verified At-Home Care | HomeHealth`;

  const pageDescription = isCityScoped
    ? `Book ${resolvedService.name.toLowerCase()} in ${activeCity.name} (${activeCity.zones.slice(0, 4).join(', ')}). ${resolvedService.metaDescription} Arrival in ${activeCity.etaRange}. Pay after care.`
    : `${resolvedService.metaDescription} Available across Faisalabad, Lahore, Islamabad, Rawalpindi, Multan & Gujranwala.`;

  const keywords = [
    `${resolvedService.shortName.toLowerCase()} in ${activeCity.name.toLowerCase()}`,
    `home ${resolvedService.slug.replace('-', ' ')} ${activeCity.name.toLowerCase()}`,
    `${resolvedService.name.toLowerCase()} ${activeCity.name.toLowerCase()}`,
    'home healthcare pakistan',
    `home medical services ${activeCity.name.toLowerCase()}`,
    ...activeCity.zones.slice(0, 5).map((z) => `${resolvedService.shortName.toLowerCase()} ${z.toLowerCase()}`),
  ];

  const localizedFaqs = [
    {
      q: `How quickly can I get ${resolvedService.shortName.toLowerCase()} at home in ${activeCity.name}?`,
      a: `Our average doorstep response time in ${activeCity.name} (${activeCity.zones.slice(0, 4).join(', ')}) is ${activeCity.etaRange} for urgent bookings, or you can pre-schedule any morning or evening slot.`,
    },
    ...resolvedService.faqs,
  ];

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalBusiness',
      name: `HomeHealth Pakistan — ${resolvedService.name} (${activeCity.name})`,
      url: `${SITE_BASE_URL}${canonicalPath}`,
      telephone: activeCity.helpline,
      priceRange: resolvedService.priceLabel,
      address: {
        '@type': 'PostalAddress',
        addressLocality: activeCity.name,
        addressRegion: activeCity.province,
        addressCountry: 'PK',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: activeCity.coordinates.lat,
        longitude: activeCity.coordinates.lng,
      },
      areaServed: activeCity.zones.map((zone) => ({
        '@type': 'Place',
        name: `${zone}, ${activeCity.name}`,
      })),
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '380',
        bestRating: '5',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: isCityScoped
        ? `${resolvedService.name} in ${activeCity.name}`
        : resolvedService.name,
      serviceType: resolvedService.name,
      description: pageDescription,
      provider: {
        '@type': 'MedicalOrganization',
        name: 'HomeHealth Pakistan',
        url: SITE_BASE_URL,
      },
      areaServed: {
        '@type': 'City',
        name: activeCity.name,
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PKR',
        price: String(resolvedService.startingPricePkr),
        availability: 'https://schema.org/InStock',
        url: `${SITE_BASE_URL}${canonicalPath}`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_BASE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Services',
          item: `${SITE_BASE_URL}/services`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: resolvedService.name,
          item: `${SITE_BASE_URL}/services/${resolvedService.slug}`,
        },
        ...(isCityScoped
          ? [
              {
                '@type': 'ListItem',
                position: 4,
                name: activeCity.name,
                item: `${SITE_BASE_URL}${canonicalPath}`,
              },
            ]
          : []),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: localizedFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-ink-900 font-sans">
      <SeoHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={canonicalPath}
        keywords={keywords}
        cityName={activeCity.name}
        coordinates={activeCity.coordinates}
        jsonLd={structuredData}
      />

      <TopNav variant="solid" />

      {/* ───── Breadcrumb Bar ───── */}
      <nav
        aria-label="Breadcrumb"
        className="bg-ink-50/70 border-b border-ink-100 py-3 px-6 text-xs text-ink-500"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-brand-700 font-medium">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
          <Link to="/services" className="hover:text-brand-700 font-medium">
            Services
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
          {isCityScoped ? (
            <>
              <Link
                to={`/services/${resolvedService.slug}`}
                className="hover:text-brand-700 font-medium"
              >
                {resolvedService.shortName}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
              <span className="text-ink-900 font-bold">{activeCity.name}</span>
            </>
          ) : (
            <span className="text-ink-900 font-bold">{resolvedService.name}</span>
          )}
        </div>
      </nav>

      {/* ───── Service + City Hero Section ───── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white pt-10 pb-16 lg:pt-14 lg:pb-24 border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" size="md">
                {resolvedService.councilBadge}
              </Badge>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 text-xs font-semibold">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>Available Across {activeCity.name}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink-900 leading-[1.12]">
              {resolvedService.name} in{' '}
              <span className="text-brand-700">{activeCity.name}</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-600 leading-relaxed">
              {resolvedService.overview}
            </p>

            {/* City Switcher Pills */}
            <div className="pt-1">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                Select City Coverage:
              </p>
              <div className="flex flex-wrap gap-2">
                {SEO_CITIES.map((c) => {
                  const active = c.slug === activeCity.slug && isCityScoped;
                  return (
                    <Link
                      key={c.slug}
                      to={`/services/${resolvedService.slug}/${c.slug}`}
                      className={clsx(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                        active
                          ? 'bg-brand-700 text-white shadow-brand'
                          : 'bg-ink-100 text-ink-700 hover:bg-brand-50 hover:text-brand-800',
                      )}
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => handleBookNow(resolvedService.code, activeCity.name)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white shadow-brand-lg font-bold"
              >
                Book {resolvedService.shortName} in {activeCity.name}
              </Button>

              <button
                type="button"
                onClick={() =>
                  handleWhatsApp(
                    `Assalam-o-Alaikum, I want to book ${resolvedService.name} in ${activeCity.name}.`,
                  )
                }
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 hover:bg-emerald-100 transition-all"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>WhatsApp Care Coordinator</span>
              </button>
            </div>

            {/* Key SLA & Pricing Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-ink-100">
              <div>
                <p className="text-xs text-ink-500 font-medium">Starting Rate</p>
                <p className="text-lg sm:text-xl font-extrabold text-brand-700 mt-0.5">
                  {resolvedService.priceLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-500 font-medium">Doorstep ETA ({activeCity.name})</p>
                <p className="text-lg sm:text-xl font-extrabold text-ink-900 mt-0.5">
                  {activeCity.etaRange}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-500 font-medium">Payment Policy</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">
                  Pay After Care
                </p>
              </div>
            </div>
          </div>

          {/* Right Summary Card: What's Included */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-7 shadow-xl ring-1 ring-ink-100 space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-ink-100">
              <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-brand">
                {SERVICE_ICON[resolvedService.code] ?? <Stethoscope className="h-6 w-6" />}
              </div>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-brand-700">
                  Hospital-Standard Protocol
                </span>
                <h2 className="text-lg font-extrabold text-ink-900">
                  What’s Included in Every Visit
                </h2>
              </div>
            </div>

            <ul className="space-y-3">
              {resolvedService.includedItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="p-4 rounded-2xl bg-brand-50/70 ring-1 ring-brand-200/60 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-800">
                Who Is This Ideal For?
              </p>
              <ul className="space-y-1.5 text-xs text-ink-700">
                {resolvedService.idealFor.map((ideal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-600 font-bold">•</span>
                    <span>{ideal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              fullWidth
              size="lg"
              onClick={() => handleBookNow(resolvedService.code, activeCity.name)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="font-bold"
            >
              Schedule Home Visit Now
            </Button>
          </div>
        </div>
      </section>

      {/* ───── Clinical Capabilities & Highlights ───── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6 space-y-5">
            <Badge tone="brand">Clinical Scope</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Clinical Procedures & Standards for {resolvedService.shortName} in {activeCity.name}
            </h2>
            <p className="text-ink-600 text-sm sm:text-base leading-relaxed">
              Every {resolvedService.shortName.toLowerCase()} assignment in {activeCity.name} is supervised by our
              clinical dispatch desk. We enforce strict sterile protocols, verified practitioner credentials, and
              complete digital documentation.
            </p>

            <div className="space-y-3 pt-2">
              {resolvedService.clinicalHighlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-ink-50/60 border border-ink-100"
                >
                  <CheckCircle2 className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-ink-800">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Local Coverage Zones & Post-Hospital Discharge Support */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-3xl p-7 bg-gradient-to-br from-brand-50/70 to-white border border-brand-200/70 shadow-card">
              <div className="flex items-center gap-2.5 mb-4">
                <MapPin className="h-5 w-5 text-brand-700" />
                <h3 className="text-xl font-bold text-ink-900">
                  Areas We Cover in {activeCity.name}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-600 mb-5">
                {activeCity.description} Fast {activeCity.etaRange} dispatch to all major sectors and housing colonies:
              </p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {activeCity.zones.map((zone) => (
                  <div
                    key={zone}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-ink-100 text-xs font-semibold text-ink-800 shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-brand-500" />
                    <span>{zone}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-brand-100 flex items-center justify-between text-xs">
                <Link
                  to={`/locations/${activeCity.slug}`}
                  className="font-bold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                >
                  <span>View all home healthcare services in {activeCity.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Post-Discharge Hospital Support */}
            <div className="rounded-3xl p-7 bg-white border border-ink-100 shadow-card">
              <div className="flex items-center gap-2.5 mb-3">
                <Building2 className="h-5 w-5 text-brand-700" />
                <h3 className="text-lg font-bold text-ink-900">
                  Post-Hospital Discharge Continuity in {activeCity.name}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed mb-4">
                We seamlessly transition patients discharged from leading hospitals in {activeCity.name} by following
                their primary consultant’s discharge summary and prescription orders:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeCity.localHospitals.map((hosp) => (
                  <span
                    key={hosp}
                    className="px-3 py-1.5 rounded-lg bg-ink-50 text-ink-700 border border-ink-200 text-xs font-medium"
                  >
                    {hosp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Localized FAQ Section ───── */}
      <section className="py-16 lg:py-20 bg-ink-50/50 border-y border-ink-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <Badge tone="brand">Frequently Asked Questions</Badge>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink-900">
              Questions About {resolvedService.shortName} in {activeCity.name}
            </h2>
          </div>

          <div className="space-y-3">
            {localizedFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={clsx(
                    'rounded-2xl border bg-white transition-all',
                    isOpen ? 'border-brand-500 shadow-card' : 'border-ink-200',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left gap-4"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-ink-900 text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={clsx(
                        'h-4 w-4 text-ink-500 transition-transform flex-shrink-0',
                        isOpen && 'rotate-180 text-brand-700',
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-2 text-sm text-ink-600 leading-relaxed border-t border-ink-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── Related Services & City Cross-Links (Internal SEO Mesh) ───── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div>
            <h3 className="text-xl font-extrabold text-ink-900 mb-5">
              Other Home Healthcare Services in {activeCity.name}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEO_SERVICES.filter((s) => s.slug !== resolvedService.slug).map((other) => (
                <Link
                  key={other.slug}
                  to={`/services/${other.slug}/${activeCity.slug}`}
                  className="group p-5 rounded-2xl border border-ink-100 hover:border-brand-500 hover:shadow-card transition-all flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-ink-900 group-hover:text-brand-700">
                      {other.name} in {activeCity.name}
                    </p>
                    <p className="text-xs text-ink-500 mt-1">{other.priceLabel}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-700 flex-shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-ink-100">
            <h3 className="text-base font-bold text-ink-900 mb-3">
              {resolvedService.name} Across Cities in Pakistan
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {SEO_CITIES.map((c) => (
                <Link
                  key={c.slug}
                  to={`/services/${resolvedService.slug}/${c.slug}`}
                  className="px-3.5 py-2 rounded-xl bg-ink-50 hover:bg-brand-50 text-xs font-semibold text-ink-700 hover:text-brand-800 border border-ink-200 transition-colors"
                >
                  {resolvedService.shortName} in {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SeoFooter />
    </div>
  );
}

// ─── /services Directory Hub View ───────────────────────────────────────────

function ServicesDirectoryView({
  onBook,
  onWhatsApp,
}: {
  onBook: (code?: string, city?: string) => void;
  onWhatsApp: (msg?: string) => void;
}): JSX.Element {
  const title = 'At-Home Healthcare Services & City Directory | HomeHealth Pakistan';
  const description =
    'Explore PNC-verified home nursing, PMDC visiting doctors, bedside blood sample collection, physiotherapy, caregivers, and ambulance services across Faisalabad, Lahore, Islamabad, Rawalpindi, Multan & Gujranwala.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'HomeHealth Pakistan Clinical Services Catalog',
    url: `${SITE_BASE_URL}/services`,
    itemListElement: SEO_SERVICES.map((svc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: svc.name,
      url: `${SITE_BASE_URL}/services/${svc.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <SeoHead
        title={title}
        description={description}
        canonicalPath="/services"
        keywords={[
          'home healthcare services pakistan',
          'home nursing faisalabad',
          'visiting doctor at home',
          'home blood sample collection',
          'home physiotherapy pakistan',
        ]}
        jsonLd={jsonLd}
      />

      <TopNav variant="solid" />

      <section className="bg-gradient-to-b from-brand-50/70 to-white py-14 lg:py-20 border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-6 text-center max-w-3xl">
          <Badge tone="brand" size="md">
            <Sparkles className="h-3.5 w-3.5" />
            Verified Clinical Catalog
          </Badge>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900">
            Hospital-Grade Home Healthcare Services Across Pakistan
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-600 leading-relaxed">
            Choose a specialized clinical service below or select your city for localized doorstep arrival times,
            covered neighborhoods, and transparent flat rates.
          </p>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 space-y-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SEO_SERVICES.map((svc) => (
            <div
              key={svc.slug}
              className="rounded-3xl p-7 bg-white border border-ink-100 shadow-card hover:shadow-card-hover flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    {SERVICE_ICON[svc.code]}
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-800">
                    {svc.priceLabel}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-ink-900">
                  <Link to={`/services/${svc.slug}`} className="hover:text-brand-700">
                    {svc.name}
                  </Link>
                </h2>
                <p className="text-sm text-ink-600 mt-2 leading-relaxed">{svc.metaDescription}</p>

                <div className="mt-4 pt-4 border-t border-ink-100">
                  <p className="text-2xs font-bold uppercase tracking-wider text-ink-400 mb-2">
                    Available Cities:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SEO_CITIES.map((c) => (
                      <Link
                        key={c.slug}
                        to={`/services/${svc.slug}/${c.slug}`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-ink-50 hover:bg-brand-50 text-ink-700 hover:text-brand-800 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ink-100 flex items-center gap-2">
                <Link
                  to={`/services/${svc.slug}/faisalabad`}
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-brand-50 text-brand-800 hover:bg-brand-100 font-bold text-xs transition-colors"
                >
                  Service Details
                </Link>
                <Button
                  size="sm"
                  onClick={() => onBook(svc.code)}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Book Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* City Hubs Directory */}
        <div className="rounded-3xl p-8 bg-ink-50/70 border border-ink-100">
          <h2 className="text-2xl font-extrabold text-ink-900 mb-2">
            Explore Home Healthcare by City
          </h2>
          <p className="text-sm text-ink-600 mb-6">
            Select your city to view covered housing societies, response times, and local clinical teams:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEO_CITIES.map((city) => (
              <Link
                key={city.slug}
                to={`/locations/${city.slug}`}
                className="p-5 rounded-2xl bg-white border border-ink-100 hover:border-brand-500 shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-ink-900 text-base">{city.name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    ETA {city.etaRange} · {city.zones.length}+ Zones Covered
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-brand-700" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SeoFooter />
    </div>
  );
}

// ─── /locations/:citySlug City Hub View ─────────────────────────────────────

function CityHubView({
  city,
  onBook,
  onWhatsApp,
}: {
  city: SeoCitySpec;
  onBook: (code?: string, city?: string) => void;
  onWhatsApp: (msg?: string) => void;
}): JSX.Element {
  const title = `Home Healthcare, Nursing & Visiting Doctors in ${city.name} | HomeHealth Pakistan`;
  const description = `Book verified home nurses, PMDC visiting doctors, bedside blood tests, and physiotherapy in ${city.name} (${city.zones.slice(0, 4).join(', ')}). Arrival in ${city.etaRange}. Pay after care.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: `HomeHealth ${city.name}`,
    url: `${SITE_BASE_URL}/locations/${city.slug}`,
    telephone: city.helpline,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.province,
      addressCountry: 'PK',
    },
    areaServed: city.zones.map((z) => ({ '@type': 'Place', name: `${z}, ${city.name}` })),
  };

  return (
    <div className="min-h-screen bg-white text-ink-900">
      <SeoHead
        title={title}
        description={description}
        canonicalPath={`/locations/${city.slug}`}
        cityName={city.name}
        coordinates={city.coordinates}
        keywords={[
          `home healthcare ${city.name.toLowerCase()}`,
          `home nursing service ${city.name.toLowerCase()}`,
          `doctor at home ${city.name.toLowerCase()}`,
          `home blood test ${city.name.toLowerCase()}`,
          `physiotherapy at home ${city.name.toLowerCase()}`,
        ]}
        jsonLd={jsonLd}
      />

      <TopNav variant="solid" />

      <section className="bg-gradient-to-b from-brand-50/70 to-white py-14 lg:py-20 border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-6">
          <Badge tone="brand" size="md">
            <MapPin className="h-3.5 w-3.5" />
            {city.name} Operations Hub · ETA {city.etaRange}
          </Badge>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900 max-w-3xl">
            Verified Home Healthcare & Nursing Services in{' '}
            <span className="text-brand-700">{city.name}</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-ink-600 max-w-2xl leading-relaxed">
            {city.description} All practitioners are PNC/PMDC licensed and background verified.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => onBook(undefined, city.name)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Book Home Visit in {city.name}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                onWhatsApp(`Assalam-o-Alaikum, I need home healthcare in ${city.name}.`)
              }
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp {city.name} Desk
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 space-y-14">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900 mb-6">
            Available Clinical Services in {city.name}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SEO_SERVICES.map((svc) => (
              <div
                key={svc.slug}
                className="rounded-3xl p-6 bg-white border border-ink-100 shadow-card hover:shadow-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                      {SERVICE_ICON[svc.code]}
                    </div>
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                      {svc.priceLabel}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">
                    <Link
                      to={`/services/${svc.slug}/${city.slug}`}
                      className="hover:text-brand-700"
                    >
                      {svc.name} in {city.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                    {svc.metaDescription}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-ink-100 flex items-center justify-between">
                  <Link
                    to={`/services/${svc.slug}/${city.slug}`}
                    className="text-xs font-bold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1"
                  >
                    <span>View {city.name} details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button size="sm" onClick={() => onBook(svc.code, city.name)}>
                    Book
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zones in City */}
        <div className="rounded-3xl p-8 bg-ink-50/70 border border-ink-100">
          <h2 className="text-xl font-extrabold text-ink-900 mb-4">
            Neighborhoods & Sectors Covered in {city.name}
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {city.zones.map((zone) => (
              <div
                key={zone}
                className="px-4 py-3 rounded-xl bg-white border border-ink-100 text-xs font-semibold text-ink-800 flex items-center gap-2"
              >
                <Check className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                <span>{zone}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeoFooter />
    </div>
  );
}

function SeoFooter(): JSX.Element {
  return (
    <footer className="bg-ink-950 text-ink-400 border-t border-ink-800">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <BrandLogo variant="white" size="md" subtitleText="PAKISTAN" asLink to="/" />
          <p className="text-xs text-ink-500">
            PNC & PMDC Verified Home Healthcare Across Pakistan · 24/7 Care Helpline: +92 300 1234567
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <Link to="/services" className="hover:text-white">
            All Services
          </Link>
          <Link to="/locations/faisalabad" className="hover:text-white">
            Faisalabad
          </Link>
          <Link to="/locations/lahore" className="hover:text-white">
            Lahore
          </Link>
          <Link to="/locations/islamabad" className="hover:text-white">
            Islamabad
          </Link>
          <Link to="/book" className="text-brand-400 font-bold hover:text-white">
            Book Appointment
          </Link>
        </div>
      </div>
    </footer>
  );
}
