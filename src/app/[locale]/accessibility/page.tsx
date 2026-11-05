import { type Metadata } from 'next';
import { getFormatter, getTranslations } from 'next-intl/server';

import { Breadcrumb } from '@/components/seo/breadcrumb';
import { currentLocale } from '@/i18n/locale';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo/metadata';
import { pickDescription } from '@/lib/seo/text';

export const revalidate = 86400;

const REVIEWED = '2026-10-13';

const MEASURES = ['keyboard', 'semantics', 'motion', 'contrast', 'noScript'] as const;
const LIMITS = ['decorative', 'thirdParty'] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const t = await getTranslations('accessibility');

  return pageMetadata({
    locale,
    path: '/accessibility',
    title: t('title'),
    description: pickDescription(t('metaDescription'), t('intro')),
  });
}

export default async function AccessibilityPage(): Promise<React.JSX.Element> {
  const [t, tProjects, format] = await Promise.all([
    getTranslations('accessibility'),
    getTranslations('projects'),
    getFormatter(),
  ]);
  const crumbs = [
    { name: tProjects('home'), path: '/' },
    { name: t('title'), path: '/accessibility' },
  ];
  const reviewed = format.dateTime(new Date(`${REVIEWED}T12:00:00Z`), {
    dateStyle: 'long',
  });

  return (
    <article className="section-y">
      <div className="container-page measure">
        <Breadcrumb crumbs={crumbs} />
        <h1 className="mt-8 text-h2">{t('title')}</h1>
        <p className="mt-5 text-text-2">{t('intro')}</p>

        <section className="mt-12">
          <h2 className="text-h3">{t('standardTitle')}</h2>
          <p className="mt-4 text-text-2">{t('standardText')}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-h3">{t('measuresTitle')}</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-text-2">
            {MEASURES.map((key) => (
              <li key={key}>{t(`measures.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-h3">{t('limitationsTitle')}</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-text-2">
            {LIMITS.map((key) => (
              <li key={key}>{t(`limitations.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-h3">{t('feedbackTitle')}</h2>
          <p className="mt-4 text-text-2">{t('feedbackText')}</p>
          <p className="mt-4">
            <Link
              href={{ pathname: '/', hash: 'contact' }}
              className="text-text-1 underline-offset-4 hover-fine:underline"
            >
              {t('feedbackLink')}
            </Link>
          </p>
        </section>

        <p className="mt-12 text-small text-text-3">{t('lastReviewed', { date: reviewed })}</p>
      </div>
    </article>
  );
}
