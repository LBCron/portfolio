'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef } from 'react';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import { NAV_SECTIONS } from './nav-items';
import { useActiveSection } from './use-active-section';

export function DesktopNav(): React.JSX.Element {
  const t = useTranslations('header');
  const pathname = usePathname();
  const isHome = pathname === '/';
  const active = useActiveSection(NAV_SECTIONS, isHome);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // The indicator slides between items with a transform transition; it is
  // positioned from the active link's box, so no React state per frame.
  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;

    if (!list || !indicator) return;

    const link = active ? list.querySelector<HTMLElement>(`[data-section="${active}"]`) : null;

    if (!link) {
      indicator.style.opacity = '0';

      return;
    }

    indicator.style.opacity = '1';
    indicator.style.width = `${link.offsetWidth}px`;
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }, [active]);

  return (
    <nav aria-label={t('primaryNav')} className="relative hidden md:block">
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="absolute top-[calc(50%-18px)] left-0 h-9 rounded-full border border-line-strong bg-surface-2 opacity-0 transition-[transform,width,opacity] duration-300 ease-out-expo"
      />
      <ul ref={listRef} className="flex items-center gap-1">
        {!isHome ? (
          <li className="mr-2">
            <Link
              href={{ pathname: '/', hash: 'work' }}
              className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-small text-text-1 hover-fine:text-white"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('backToWork')}
            </Link>
          </li>
        ) : null}
        {NAV_SECTIONS.map((section) => (
          <li key={section}>
            <Link
              href={{ pathname: '/', hash: section }}
              data-section={section}
              aria-current={active === section ? 'location' : undefined}
              className={cn(
                'relative inline-flex min-h-11 items-center rounded-full px-3.5 text-small transition-colors duration-200',
                active === section ? 'text-text-1' : 'text-text-2 hover-fine:text-text-1',
              )}
            >
              {t(`nav.${section}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
