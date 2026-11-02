import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { locale as rootLocale } from 'next/root-params';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { LanguageAnnouncer } from '@/components/layout/language-announcer';
import { MotionInit } from '@/components/layout/motion-init';
import { MotionProvider } from '@/components/layout/motion-provider';
import { RouteFocus } from '@/components/layout/route-focus';
import { ScrollProgress } from '@/components/layout/scroll-progress';
import { SkipLink } from '@/components/layout/skip-link';
import { Toaster } from '@/components/ui/toaster';
import { TerminalWindow } from '@/components/window-manager/terminal-window';
import { owner, THEME_COLOR } from '@/config/site';
import { isAppLocale, localeTags, routing } from '@/i18n/routing';
import { siteMetadata } from '@/lib/seo/metadata';
import { fontVariables } from '@/styles/fonts';

/** Namespaces needed by client components; the rest stays on the server. */
const CLIENT_NAMESPACES = [
  'a11y',
  'header',
  'errors',
  'project',
  'stack',
  'window',
] as const;

export const revalidate = 86400;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: THEME_COLOR,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return siteMetadata(
    t('siteDescription', {
      name: owner.name,
      jobTitle: owner.jobTitle,
      city: `${owner.city}, ${owner.country}`,
    }),
  );
}

export default async function LocaleLayout({
  children,
}: LayoutProps<'/[locale]'>) {
  const locale = await rootLocale();
  if (!isAppLocale(locale)) notFound();

  const messages = await getMessages();
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]),
  );

  return (
    <html
      lang={localeTags[locale]}
      className={fontVariables}
      // Lets Next turn off our smooth scrolling for route changes, so a new
      // page starts at the top at once (and the cover morph measures it).
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <MotionInit />
        <NextIntlClientProvider messages={clientMessages}>
          <MotionProvider>
            <SkipLink />
            <ScrollProgress />
            <Header />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <Footer />
            <Toaster />
            <TerminalWindow />
            <LanguageAnnouncer />
            <RouteFocus />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
