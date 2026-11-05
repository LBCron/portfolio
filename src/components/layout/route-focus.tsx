'use client';

import { useEffect, useRef } from 'react';

import { usePathname } from '@/i18n/navigation';

/**
 * Moves focus to the page heading after client-side route changes so keyboard
 * and screen reader users start at the new content (Next's route announcer
 * still runs). Hash-only navigation keeps the browser's own behavior.
 */
export function RouteFocus(): null {
  const pathname = usePathname();
  const previousRef = useRef(pathname);

  useEffect(() => {
    if (previousRef.current === pathname) return;

    previousRef.current = pathname;

    if (window.location.hash) return;

    const heading = document.querySelector<HTMLElement>('main h1');
    const target = heading ?? document.getElementById('main');

    if (!target) return;

    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

    target.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
