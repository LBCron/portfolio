import 'server-only';

import { env } from '@/env';
import { type AppLocale, localeTags, routing } from '@/i18n/routing';

export const SITE_URL = env.NEXT_PUBLIC_SITE_URL;

/**
 * `/en` + `/projects` → `/en/projects`; `''` and `/` map to the locale root.
 */
export function localizedPath(locale: AppLocale, path = '') {
  const clean = path === '/' ? '' : path;

  return `/${locale}${clean}`;
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Hreflang map for a locale-independent path: one entry per locale (BCP-47)
 * plus `x-default` pointing at English.
 */
export function languageAlternates(path = '') {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[localeTags[locale]] = absoluteUrl(localizedPath(locale, path));
  }
  languages['x-default'] = absoluteUrl(localizedPath(routing.defaultLocale, path));

  return languages;
}

export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
