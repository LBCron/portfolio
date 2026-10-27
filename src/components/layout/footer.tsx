import { ArrowUp } from 'lucide-react';
import { locale as rootLocale } from 'next/root-params';
import { getTranslations } from 'next-intl/server';

import { LinkIcon } from '@/components/content/link-icon';
import { externalRel } from '@/components/sections/links';
import { owner } from '@/config/site';
import { Link } from '@/i18n/navigation';
import { isAppLocale } from '@/i18n/routing';
import { getContent } from '@/lib/content';

import { MotionToggle } from './motion-toggle';
import { ShortcutKbd } from './shortcut-kbd';

export async function Footer() {
  const locale = await rootLocale();
  const [t, tA11y, links] = await Promise.all([
    getTranslations('footer'),
    getTranslations('a11y'),
    isAppLocale(locale)
      ? getContent().getFeaturedLinks(locale)
      : Promise.resolve([]),
  ]);
  const footerLinks = links.filter((link) =>
    link.placements.includes('footer'),
  );
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-bg-1">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-text-1">{t('builtBy', { name: owner.name })}</p>
            <p className="text-small text-text-3">
              {t('copyright', { year, name: owner.name })}
            </p>
            <p className="text-small text-text-3">
              {t.rich('terminalHint', { kbd: () => <ShortcutKbd /> })}
            </p>
          </div>
          {footerLinks.length > 0 ? (
            <ul aria-label={t('linksLabel')} className="-ml-3 flex gap-1">
              {footerLinks.map((link) => {
                const external = !link.url.startsWith('mailto:');
                return (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target={external ? '_blank' : undefined}
                      rel={
                        external ? externalRel(link.isOwnProfile) : undefined
                      }
                      aria-label={
                        external
                          ? `${link.label} ${tA11y('opensInNewTab')}`
                          : link.label
                      }
                      title={link.label}
                      className="inline-flex size-11 items-center justify-center rounded-full text-text-2 transition-colors hover-fine:bg-surface-1 hover-fine:text-text-1"
                    >
                      <LinkIcon icon={link.icon} className="size-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <nav aria-label={t('footerNav')}>
          <ul className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/accessibility"
                className="inline-flex min-h-11 items-center rounded-full px-4 text-small text-text-2 underline-offset-4 hover-fine:text-text-1 hover-fine:underline"
              >
                {t('accessibility')}
              </Link>
            </li>
            <li>
              <MotionToggle />
            </li>
            <li>
              <a
                href="#top"
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-small text-text-2 hover-fine:text-text-1"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
                {t('backToTop')}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
