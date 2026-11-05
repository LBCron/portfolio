import { owner } from '@/config/site';
import { isAppLocale, routing } from '@/i18n/routing';
import { getContent } from '@/lib/content';
import { ogContentType, ogSize, renderOgImage } from '@/lib/seo/og-image';

export const alt = `Project — ${owner.name}`;
export const size = ogSize;
export const contentType = ogContentType;
export const revalidate = 86400;

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = isAppLocale(locale) ? locale : routing.defaultLocale;
  const lookup = await getContent().getProject(resolved, slug);

  if (lookup.status !== 'found') {
    return renderOgImage({
      title: owner.name,
      subtitle: owner.jobTitle,
      alt,
    });
  }

  const { project } = lookup;

  return renderOgImage({
    title: project.title,
    subtitle: project.tagline,
    alt: project.title,
    photoUrl: project.cover?.url,
  });
}
