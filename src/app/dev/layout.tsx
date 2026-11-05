import '@/styles/globals.css';

import { type Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';

import { Toaster } from '@/components/ui/toaster';
import { fontVariables } from '@/styles/fonts';

import messages from '../../../messages/en.json';

export const metadata: Metadata = {
  title: 'UI components',
  robots: { index: false, follow: false },
};

/**
 * Development-only playground; the proxy also hides it in production.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <NextIntlClientProvider locale="en" messages={messages}>
          <main id="main">{children}</main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
