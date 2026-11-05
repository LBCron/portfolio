import { getLocale, getTranslations } from 'next-intl/server';

import { NotFoundView } from '@/components/layout/not-found-view';

export default async function LocaleNotFound(): Promise<React.JSX.Element> {
  const [t, locale] = await Promise.all([getTranslations('errors'), getLocale()]);

  return (
    <NotFoundView
      title={t('notFoundTitle')}
      text={t('notFoundText')}
      prompt={t('notFoundPrompt', { path: '???' })}
      homeHref={`/${locale}`}
      homeLabel={t('backHome')}
    />
  );
}
