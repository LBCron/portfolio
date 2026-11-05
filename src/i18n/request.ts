import { getRequestConfig } from 'next-intl/server';
import { locale as rootLocale } from 'next/root-params';

import { isAppLocale, routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const candidate = locale ?? (await rootLocale());
  const resolved = isAppLocale(candidate) ? candidate : routing.defaultLocale;

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
  };
});
