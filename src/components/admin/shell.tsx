import Link from 'next/link';
import type { ReactNode } from 'react';

import { contentSource, env, isProduction } from '@/env';

import { ADMIN_NAV } from './nav';
import { SessionControls } from './session-controls';

const itemClass =
  'inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-small';

function NavItems() {
  return ADMIN_NAV.map((item) => (
    <li key={item.label} className="shrink-0">
      {item.href ? (
        <a
          href={item.href}
          aria-current="page"
          className={`${itemClass} bg-surface-2 text-text-1`}
        >
          {item.label}
        </a>
      ) : (
        <span aria-disabled="true" className={`${itemClass} text-text-3`}>
          {item.label}
        </span>
      )}
    </li>
  ));
}

export function AdminShell({
  expiresAt,
  children,
}: {
  expiresAt: number;
  children: ReactNode;
}) {
  const source =
    contentSource === 'sanity'
      ? `Sanity · ${env.SANITY_DATASET}`
      : isProduction
        ? 'Demo data, read-only'
        : 'Demo data';

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface-2 focus:p-3"
      >
        Skip to content
      </a>
      <aside className="hidden border-r border-line md:block">
        <p className="p-4 font-mono text-small text-text-1">julio · admin</p>
        <nav aria-label="Admin areas">
          <ul className="flex flex-col gap-1 p-2">
            <NavItems />
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col pb-14 md:pb-0">
        <header className="flex flex-wrap items-center justify-end gap-3 border-b border-line px-4 py-2">
          <span className="mr-auto rounded-full border border-line px-3 py-1 text-xs text-text-2">
            {source}
          </span>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex min-h-11 items-center text-small text-text-2 hover-fine:text-text-1"
          >
            View site
          </Link>
          <SessionControls expiresAt={expiresAt} />
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 p-4 outline-none md:p-8"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Admin areas"
        className="fixed inset-x-0 bottom-0 overflow-x-auto border-t border-line bg-bg-1 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex gap-1 px-2">
          <NavItems />
        </ul>
      </nav>
    </div>
  );
}
