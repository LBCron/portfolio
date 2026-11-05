import { type AppLocale, LOCALE_COOKIE } from './routing';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Saves an explicit language choice; only ever called on a user switch.
 */
export function saveLocalePreference(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}
