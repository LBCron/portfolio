import '@/styles/globals.css';

import type { Metadata, Viewport } from 'next';

import { AdminShell } from '@/components/admin/shell';
import { Toaster } from '@/components/ui/toaster';
import { THEME_COLOR } from '@/config/site';
import { requireAdmin } from '@/lib/auth/session';
import { fontVariables } from '@/styles/fonts';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    notranslate: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: THEME_COLOR,
};

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const session = await requireAdmin();

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <AdminShell expiresAt={session.exp * 1000}>{children}</AdminShell>
        <Toaster />
      </body>
    </html>
  );
}
