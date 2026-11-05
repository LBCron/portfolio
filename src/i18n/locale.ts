import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';

import { type AppLocale, isAppLocale } from './routing';

/**
 * The locale of the current `[locale]` request. 404s on a bad segment.
 */
export async function currentLocale(): Promise<AppLocale> {
  const locale = await rootLocale();

  if (!isAppLocale(locale)) notFound();

  return locale;
}
