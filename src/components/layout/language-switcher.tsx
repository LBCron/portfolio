'use client';

import { useLocale, useTranslations } from 'next-intl';
import { type KeyboardEvent, type MouseEvent, useRef } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { type AppLocale, localeTags, routing } from '@/i18n/routing';
import { cn } from '@/lib/cn';

import { switchLocale } from './switch-locale';

/**
 * Segmented EN | PT control made of real links (works without JS). With JS it
 * keeps query, hash and approximate scroll position, and saves the choice.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations('header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const groupRef = useRef<HTMLDivElement>(null);

  function hrefFor(target: AppLocale) {
    return pathname === '/' ? `/${target}` : `/${target}${pathname}`;
  }

  function handleClick(
    event: MouseEvent<HTMLAnchorElement>,
    target: AppLocale,
  ) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    if (target === locale) return;

    switchLocale(router, pathname, target);
  }

  // Roving tabindex: the current language is the single tab stop and the
  // arrow keys move between options.
  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const links = Array.from(
      groupRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [],
    );
    const current = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (current === -1) return;
    event.preventDefault();
    const last = links.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight'
            ? (current + 1) % links.length
            : (current - 1 + links.length) % links.length;
    links[next]?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="group"
      aria-label={t('language')}
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-surface-1/60 p-0.5',
        className,
      )}
    >
      {routing.locales.map((target) => {
        const current = target === locale;
        return (
          <a
            key={target}
            href={hrefFor(target)}
            hrefLang={localeTags[target]}
            lang={localeTags[target]}
            aria-current={current ? 'true' : undefined}
            tabIndex={current ? 0 : -1}
            onClick={(event) => handleClick(event, target)}
            onKeyDown={handleKeyDown}
            className={cn(
              'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 font-mono text-[0.75rem] tracking-[0.08em] transition-colors duration-200',
              current
                ? 'bg-surface-2 text-text-1 shadow-[inset_0_0_0_1px_var(--color-line-strong)]'
                : 'text-text-3 hover-fine:text-text-1',
            )}
          >
            {t(`languageShort.${target}`)}
            <span className="sr-only">, {t(`languageNames.${target}`)}</span>
          </a>
        );
      })}
    </div>
  );
}
