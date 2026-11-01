import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { createTranslator } from 'next-intl';

import { NotFoundView } from '@/components/layout/not-found-view';
import { THEME_COLOR } from '@/config/site';
import { fontVariables } from '@/styles/fonts';

import messages from '../../messages/en.json';

// Messages are precompiled at build time (D57), so they go through a
// translator rather than being read as raw strings.
const t = createTranslator({ locale: 'en', messages, namespace: 'errors' });

/**
 * Served for every URL outside the locale tree, including anonymous admin
 * requests, so it must not depend on the request in any way.
 */
export const metadata: Metadata = {
  title: t('notFoundTitle'),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: THEME_COLOR,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <main id="main">
          <NotFoundView
            title={t('notFoundTitle')}
            text={t('notFoundText')}
            prompt={t('notFoundPrompt', { path: '???' })}
            homeHref="/"
            homeLabel={t('backHome')}
          />
        </main>
      </body>
    </html>
  );
}
