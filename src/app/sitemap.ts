import { type MetadataRoute } from 'next';

import { type AppLocale, routing } from '@/i18n/routing';
import { getContent } from '@/lib/content';
import { absoluteUrl, languageAlternates, localizedPath } from '@/lib/seo/urls';

export const revalidate = 86400;

function newest(...dates: Array<string | undefined>) {
  return dates
    .filter((date): date is string => Boolean(date))
    .reduce((latest, date) => (date > latest ? date : latest), '');
}

function entries(path: string, lastModified?: string, images?: string[]): MetadataRoute.Sitemap {
  return routing.locales.map((locale: AppLocale) => ({
    url: absoluteUrl(localizedPath(locale, path)),
    lastModified: lastModified || undefined,
    alternates: { languages: languageAlternates(path) },
    ...(images && images.length > 0 ? { images } : {}),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = getContent();
  const [profile, resume, projects] = await Promise.all([
    content.getProfile('en'),
    content.getResume(),
    content.getProjects('en'),
  ]);

  const homeModified = newest(
    profile?.updatedAt,
    resume?.updatedAt,
    ...projects.map((project) => project.updatedAt),
  );

  return [
    ...entries('/', homeModified),
    ...entries('/projects', newest(...projects.map((project) => project.updatedAt))),
    ...entries('/accessibility'),
    ...projects.flatMap((project) =>
      entries(
        `/projects/${project.slug}`,
        project.updatedAt,
        project.cover ? [absoluteUrl(project.cover.url)] : undefined,
      ),
    ),
  ];
}
