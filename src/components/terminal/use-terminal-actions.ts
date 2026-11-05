'use client';

import { useMemo } from 'react';

import { switchLocale } from '@/components/layout/switch-locale';
import { TERMINAL_ID } from '@/components/window-manager/terminal-controls';
import { usePathname, useRouter } from '@/i18n/navigation';
import { type CommandActions } from '@/lib/terminal/commands/types';
import { useSessionStore } from '@/stores/session-store';
import { useTerminalStore } from '@/stores/terminal-store';
import { useWindowStore } from '@/stores/window-store';

function openInNewTab(href: string) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.click();
}

/**
 * What commands may do to the site; the window stays open throughout.
 */
export function useTerminalActions(): Omit<CommandActions, 'effect'> {
  const router = useRouter();
  const pathname = usePathname();

  return useMemo(
    () => ({
      navigate: (href) => router.push(href),
      scrollToSection: (id) => {
        if (pathname === '/') window.location.hash = id;
        else router.push(`/#${id}`);
      },
      setLocale: (target) => switchLocale(router, pathname, target),
      setCwd: (path) => useTerminalStore.getState().setCwd(path),
      clear: () => useTerminalStore.getState().clear(),
      downloadResume: (locale) => openInNewTab(`/${locale}/resume`),
      openExternal: (url) => openInNewTab(url),
      goTo: (url) => window.location.assign(url),
      setSession: (session) => useSessionStore.getState().set(session),
      window: {
        close: () => useWindowStore.getState().close(TERMINAL_ID),
        minimize: () => useWindowStore.getState().minimize(TERMINAL_ID),
        maximize: () => useWindowStore.getState().toggleMaximize(TERMINAL_ID),
      },
    }),
    [router, pathname],
  );
}
