import 'server-only';

import { createClient } from '@sanity/client';

import { contentSource, env, isProduction } from '@/env';

import { getFixtureDataset } from '../fixtures/shared';
import { createFixturesAdminStore } from './fixtures-store';
import { createSanityAdminStore } from './sanity-store';
import type { AdminStore } from './types';

const holder = globalThis as { __jmAdminStore?: AdminStore };

/** The admin's view of the configured content source. */
export function getAdminStore(): AdminStore {
  holder.__jmAdminStore ??= create();
  return holder.__jmAdminStore;
}

function create(): AdminStore {
  if (contentSource === 'sanity') {
    const token = env.SANITY_WRITE_TOKEN ?? env.SANITY_READ_TOKEN;
    const dataset = env.SANITY_DATASET as string;
    const client = createClient({
      projectId: env.SANITY_PROJECT_ID as string,
      dataset,
      apiVersion: env.SANITY_API_VERSION,
      ...(token ? { token } : {}),
      useCdn: false,
      perspective: 'published',
    });
    return createSanityAdminStore(client, {
      dataset,
      ...(env.SANITY_WRITE_TOKEN
        ? {}
        : { readOnlyReason: 'SANITY_WRITE_TOKEN is not set' }),
    });
  }
  return createFixturesAdminStore(getFixtureDataset(), {
    writable: !isProduction || env.ADMIN_FIXTURE_WRITES === '1',
    readOnlyReason: 'Demo data is read-only in production',
  });
}

export type { AdminDoc, AdminStore } from './types';
