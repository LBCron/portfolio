import 'server-only';

import { revalidatePath, updateTag } from 'next/cache';

import { contentSource } from '@/env';
import { type AdminHooks } from '@/lib/content/admin/service';
import { contentTags, tagsForDocument } from '@/lib/content/tags';

/**
 * `updateTag` expires the data at once, so the next request sees the edit.
 * Fixtures are not fetched through the tagged cache, so for them whole layouts
 * are revalidated instead.
 */
export const adminHooks: AdminHooks = {
  revalidate(type, slugs) {
    for (const tag of tagsForDocument(type, slugs)) updateTag(tag);
    revalidatePath('/sitemap.xml');

    if (contentSource === 'fixtures') revalidatePath('/', 'layout');
  },
  audit: (event) => console.info(JSON.stringify({ event: 'admin.write', ...event })),
  now: () => new Date(),
};

export function revalidateEverything(): void {
  for (const tag of Object.values(contentTags)) {
    if (typeof tag === 'string') updateTag(tag);
  }
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
}
