import { notFound } from 'next/navigation';
import { type NextRequest, NextResponse } from 'next/server';

import { isAppLocale } from '@/i18n/routing';
import { getContent } from '@/lib/content';

export const revalidate = 86400;

/**
 * 307 to the current-locale PDF; 404 when that file is missing.
 */
export async function GET(request: NextRequest, context: RouteContext<'/[locale]/resume'>) {
  const { locale } = await context.params;

  if (!isAppLocale(locale)) notFound();

  const resume = await getContent().getResume();
  const file = resume?.files[locale];

  if (!file) notFound();

  return NextResponse.redirect(new URL(file.url, request.url), 307);
}
