import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'always',
  // Negotiation and the NEXT_LOCALE cookie are handled by src/proxy.ts and the
  // language switcher, so the cookie is only written on an explicit switch.
  localeCookie: false,
  localeDetection: false,
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * BCP-47 tags for `<html lang>`, hreflang and `Intl`.
 */
export const localeTags = {
  en: 'en',
  pt: 'pt-BR',
} as const satisfies Record<AppLocale, string>;

/**
 * Open Graph locale identifiers.
 */
export const ogLocales = {
  en: 'en_US',
  pt: 'pt_BR',
} as const satisfies Record<AppLocale, string>;

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value);
}
