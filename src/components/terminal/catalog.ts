import { createTranslator } from 'next-intl';

import { type AppLocale } from '@/i18n/routing';
import { type Translate } from '@/lib/terminal/vfs';

// Each locale is its own lazy chunk: the terminal strings never ship to a
// visitor who does not open the terminal.
const loaders = {
  en: () => import('../../../messages/en.json'),
  pt: () => import('../../../messages/pt.json'),
} as const;

const cache = new Map<AppLocale, Promise<Translate>>();

export function loadTranslator(locale: AppLocale): Promise<Translate> {
  let pending = cache.get(locale);

  if (!pending) {
    pending = loaders[locale]().then((module) => {
      const translator = createTranslator({
        locale,
        messages: module.default,
        onError: () => {},
        getMessageFallback: ({ key }) => key,
      });

      return translator as unknown as Translate;
    });
    cache.set(locale, pending);
  }

  return pending;
}
