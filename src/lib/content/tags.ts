/**
 * Fallback lifetime for cached content, in case a revalidation is missed.
 */
export const CONTENT_REVALIDATE_SECONDS = 86_400;

export const contentTags = {
  profile: 'content:profile',
  contact: 'content:contact',
  resume: 'content:resume',
  links: 'content:links',
  recommended: 'content:recommended',
  projects: 'content:projects',
  project: (slug: string) => `content:project:${slug}`,
  experience: 'content:experience',
  education: 'content:education',
  technologies: 'content:technologies',
  practices: 'content:practices',
} as const;

export type ContentTag = `content:${string}`;

/**
 * Tags to revalidate when a document type changes (webhook and admin). Reads
 * that filter technology references also carry the technologies tag.
 */
export function tagsForDocument(type: string, slugs: string[] = []): string[] {
  switch (type) {
    case 'contact':
      return [contentTags.contact];
    case 'education':
      return [contentTags.education];
    case 'experience':
      return [contentTags.experience];
    case 'featuredLink':
      return [contentTags.links];
    case 'practice':
      return [contentTags.practices];
    case 'profile':
      return [contentTags.profile];
    case 'project':
      return [contentTags.projects, ...slugs.map(contentTags.project)];
    case 'recommendedProfile':
      return [contentTags.recommended];
    case 'resume':
      return [contentTags.resume];
    case 'technology':
      return [contentTags.technologies];
    default:
      return [];
  }
}
