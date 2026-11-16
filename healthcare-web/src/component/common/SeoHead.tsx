import { useEffect } from 'react';
import { SITE_BASE_URL } from '../../constant/seoCatalog';

export interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string[];
  ogType?: 'website' | 'article';
  noindex?: boolean;
  cityName?: string;
  coordinates?: { lat: string; lng: string };
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  keywords,
  ogType = 'website',
  noindex = false,
  cityName = 'Faisalabad',
  coordinates,
  jsonLd,
}: SeoHeadProps): null {
  useEffect(() => {
    const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const fullUrl = `${SITE_BASE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;

    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1',
    );

    if (keywords && keywords.length > 0) {
      upsertMeta('name', 'keywords', keywords.join(', '));
    }

    upsertCanonical(fullUrl);

    // OpenGraph tags
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', fullUrl);
    upsertMeta('property', 'og:site_name', 'HomeHealth Pakistan');
    upsertMeta('property', 'og:locale', 'en_PK');
    upsertMeta('property', 'og:image', `${SITE_BASE_URL}/assets/logo-full.jpg`);

    // Twitter tags
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    // Local Geo SEO tags
    upsertMeta('name', 'geo.region', 'PK-PB');
    upsertMeta('name', 'geo.placename', `${cityName}, Pakistan`);
    if (coordinates) {
      upsertMeta('name', 'geo.position', `${coordinates.lat};${coordinates.lng}`);
      upsertMeta('name', 'ICBM', `${coordinates.lat}, ${coordinates.lng}`);
    }

    // Structured Data (Schema.org JSON-LD)
    const existingScripts = document.head.querySelectorAll('script[data-seo-jsonld="dynamic"]');
    existingScripts.forEach((s) => s.remove());

    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'dynamic');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, keywords, ogType, noindex, cityName, coordinates, jsonLd]);

  return null;
}
