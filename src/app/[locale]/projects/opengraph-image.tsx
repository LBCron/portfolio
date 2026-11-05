import { getTranslations } from 'next-intl/server';
import { type ImageResponse } from 'next/og';

import { owner } from '@/config/site';
import { isAppLocale, routing } from '@/i18n/routing';
import { ogContentType, ogSize, renderOgImage } from '@/lib/seo/og-image';

export const alt = `Projects — ${owner.name}`;
export const size = ogSize;
export const contentType = ogContentType;
export const revalidate = 86400;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<ImageResponse> {
  const { locale } = await params;
  const resolved = isAppLocale(locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: 'projects' });

  return renderOgImage({
    title: t('title'),
    subtitle: t('intro'),
    alt,
  });
}
