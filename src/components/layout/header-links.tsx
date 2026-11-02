import { locale as rootLocale } from 'next/root-params';
import { getTranslations } from 'next-intl/server';

import { LinkIcon } from '@/components/content/link-icon';
import { externalRel } from '@/components/sections/links';
import { Tooltip } from '@/components/ui/tooltip';
import { isAppLocale } from '@/i18n/routing';
import { getContent } from '@/lib/content';

const MAX_HEADER_LINKS = 3;

/** Profile icons for the header bar and the mobile menu, rendered on the server. */
export async function HeaderLinks() {
  const locale = await rootLocale();
  const [t, tA11y, links] = await Promise.all([
    getTranslations('header'),
    getTranslations('a11y'),
    isAppLocale(locale)
      ? getContent().getFeaturedLinks(locale)
      : Promise.resolve([]),
  ]);
  const headerLinks = links
    .filter((link) => link.placements.includes('header'))
    .slice(0, MAX_HEADER_LINKS);
  if (headerLinks.length === 0) return null;

  return (
    <ul aria-label={t('linksLabel')} className="flex items-center gap-1">
      {headerLinks.map((link) => (
        <li key={link.id}>
          <Tooltip content={link.label} side="bottom">
            <a
              href={link.url}
              target="_blank"
              rel={externalRel(link.isOwnProfile)}
              aria-label={`${link.label} ${tA11y('opensInNewTab')}`}
              className="inline-flex size-11 items-center justify-center rounded-full border border-line text-text-2 transition-colors hover-fine:border-line-strong hover-fine:bg-surface-1 hover-fine:text-text-1"
            >
              <LinkIcon icon={link.icon} className="size-[1.125rem]" />
            </a>
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
