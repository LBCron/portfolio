import { owner } from '@/config/site';
import { isAppLocale, routing } from '@/i18n/routing';
import { getContent } from '@/lib/content';
import { ogContentType, ogSize, renderOgImage } from '@/lib/seo/og-image';

export const alt = `${owner.name} — ${owner.jobTitle}`;
export const size = ogSize;
export const contentType = ogContentType;
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolved = isAppLocale(locale) ? locale : routing.defaultLocale;
  const profile = await getContent().getProfile(resolved);

  return renderOgImage({
    title: profile?.displayName ?? owner.name,
    subtitle: profile?.jobTitle ?? owner.jobTitle,
    alt,
    photoUrl: profile?.photo?.url,
  });
}
