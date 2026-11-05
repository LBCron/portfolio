import 'server-only';

import { env } from '@/env';

import { CONTENT_REVALIDATE_SECONDS } from '../tags';
import { type GroqFetch } from './source';

export interface SanityReadConfig {
  apiVersion: string;
  dataset: string;
  projectId: string;
  token: string;
}

/**
 * Fails with variable names only, never values.
 */
export function sanityReadConfig(): SanityReadConfig {
  const missing = (
    [
      ['SANITY_PROJECT_ID', env.SANITY_PROJECT_ID],
      ['SANITY_DATASET', env.SANITY_DATASET],
      ['SANITY_READ_TOKEN', env.SANITY_READ_TOKEN],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Sanity reads need: ${missing.join(', ')}`);
  }

  return {
    projectId: env.SANITY_PROJECT_ID as string,
    dataset: env.SANITY_DATASET as string,
    apiVersion: env.SANITY_API_VERSION,
    token: env.SANITY_READ_TOKEN as string,
  };
}

/**
 * GROQ over HTTP through Next's `fetch` cache (D1b, D8): live API (no CDN),
 * published perspective, tagged for on-demand revalidation. `force-cache` is
 * required because authorized requests are not cached by default.
 */
export function createSanityHttpFetch(config: SanityReadConfig = sanityReadConfig()): GroqFetch {
  const endpoint = `https://${config.projectId}.api.sanity.io/v${config.apiVersion}/data/query/${config.dataset}`;

  return async (query, params, tags) => {
    const url = new URL(endpoint);

    url.searchParams.set('query', query);
    url.searchParams.set('perspective', 'published');
    url.searchParams.set('returnQuery', 'false');
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(`$${name}`, JSON.stringify(value));
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: 'force-cache',
      next: { revalidate: CONTENT_REVALIDATE_SECONDS, tags: [...tags] },
    });

    if (!response.ok) {
      throw new Error(`Sanity query failed with status ${response.status}`);
    }

    const body: unknown = await response.json();

    return body && typeof body === 'object' && 'result' in body ? body.result : null;
  };
}
