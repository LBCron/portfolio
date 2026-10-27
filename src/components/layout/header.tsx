import { getTranslations } from 'next-intl/server';

import { owner } from '@/config/site';
import { Link } from '@/i18n/navigation';

import { DesktopNav } from './desktop-nav';
import { HeaderFrame } from './header-frame';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';
import { Monogram } from './monogram';
import { TerminalToggle } from './terminal-toggle';

export async function Header() {
  const t = await getTranslations('header');

  return (
    <HeaderFrame>
      <div className="container-page flex h-(--header-height) items-center justify-between gap-4">
        <Link
          href={{ pathname: '/', hash: 'top' }}
          aria-label={t('homeLabel', { name: owner.shortName })}
          className="-ml-1 inline-flex min-h-11 items-center gap-2.5 rounded-full pr-2 pl-1"
        >
          <Monogram />
          <span
            aria-hidden="true"
            className="hidden text-[0.9375rem] font-semibold tracking-[-0.01em] text-text-1 min-[400px]:inline"
          >
            {owner.shortName}
          </span>
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden xs:inline-flex" />
          <TerminalToggle />
          <MobileMenu />
        </div>
      </div>
    </HeaderFrame>
  );
}
