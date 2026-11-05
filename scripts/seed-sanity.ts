/**
 * Seeds the fictional dataset (Appendix A) into Sanity. Idempotent: stable ids
 * with `createOrReplace`, assets deduplicated by content hash.
 *
 * Bun run sanity:seed # SANITY_DATASET from the env bun run sanity:seed
 * --dataset development bun run sanity:seed --dry-run bun run sanity:seed
 * --reset # delete isFixture docs first bun run sanity:seed --dataset
 * production --force.
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';

import { env } from '@/env';
import { createFixtureDataset } from '@/lib/content/fixtures/dataset';
import { type AssetResolver, toSanityDocuments } from '@/lib/content/sanity/documents';
import { type FileAsset, type ImageAsset } from '@/lib/content/schema';

const ROOT = path.resolve(import.meta.dirname, '..');

const { values: args } = parseArgs({
  options: {
    'dataset': { type: 'string' },
    'force': { type: 'boolean', default: false },
    'reset': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const dataset = args.dataset ?? env.SANITY_DATASET;
const dryRun = args['dry-run'];

if (!env.SANITY_PROJECT_ID) fail('SANITY_PROJECT_ID is not set.');

if (!dataset) fail('Pass --dataset or set SANITY_DATASET.');

if (!/^[a-z0-9_-]+$/.test(dataset)) fail('Invalid dataset name.');

if (dataset === 'production' && !args.force) {
  fail('Refusing to seed "production" without --force.');
}

if (!dryRun && !env.SANITY_WRITE_TOKEN) fail('SANITY_WRITE_TOKEN is not set.');

const client: SanityClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset,
  apiVersion: env.SANITY_API_VERSION,
  token: env.SANITY_WRITE_TOKEN,
  useCdn: false,
  perspective: 'raw',
});

function localPath(url: string): string {
  if (!url.startsWith('/fixtures/')) fail(`Unexpected asset URL: ${url}`);

  return path.join(ROOT, 'public', url);
}

async function uploadAssets(fixtures: ReturnType<typeof createFixtureDataset>) {
  const images = new Map<string, ImageAsset>();
  const files = new Map<string, FileAsset>();

  // Collect every asset referenced by the dataset (a dry conversion).
  toSanityDocuments(fixtures, {
    image(asset) {
      images.set(asset.url, asset);

      return 'pending';
    },
    file(asset) {
      files.set(asset.url, asset);

      return 'pending';
    },
  });

  const ids = new Map<string, string>();
  const upload = async (kind: 'file' | 'image', url: string, contentType: string) => {
    if (dryRun) {
      ids.set(url, `${kind}-dry-run`);

      return;
    }

    const body = await readFile(localPath(url));
    const asset = await client.assets.upload(kind, body, {
      filename: path.basename(url),
      contentType,
      extract: kind === 'image' ? ['lqip'] : [],
      tag: 'seed',
    });

    ids.set(url, asset._id);
  };

  for (const url of images.keys()) await upload('image', url, 'image/webp');
  for (const url of files.keys()) {
    await upload('file', url, 'application/pdf');
  }
  console.log(`Assets: ${images.size} images, ${files.size} files.`);

  const resolver: AssetResolver = {
    image: (asset) => ids.get(asset.url) ?? fail(`No asset for ${asset.url}`),
    file: (asset) => ids.get(asset.url) ?? fail(`No asset for ${asset.url}`),
  };

  return resolver;
}

async function confirm(question: string, expected: string) {
  if (!process.stdin.isTTY) fail('--reset needs an interactive terminal.');

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await prompt.question(question);

  prompt.close();

  if (answer.trim() !== expected) fail('Aborted.');
}

async function reset() {
  const ids = await client.fetch<string[]>('*[isFixture == true && !(_id in path("_.**"))]._id');

  if (ids.length === 0) {
    console.log('Reset: no fixture documents.');

    return;
  }

  await confirm(
    `Delete ${ids.length} fixture documents from "${dataset}"? Type the dataset name to confirm: `,
    dataset as string,
  );

  if (dryRun) {
    console.log(`Reset (dry run): would delete ${ids.length} documents.`);

    return;
  }

  const transaction = client.transaction();
  for (const id of ids) transaction.delete(id);
  await transaction.commit({ tag: 'seed.reset' });
  console.log(`Reset: deleted ${ids.length} fixture documents.`);
}

async function main() {
  console.log(
    `Seeding project ${env.SANITY_PROJECT_ID}, dataset "${dataset}"${dryRun ? ' (dry run)' : ''}.`,
  );

  if (args.reset) await reset();

  const fixtures = createFixtureDataset();
  const resolver = await uploadAssets(fixtures);
  const documents = toSanityDocuments(fixtures, resolver);

  if (dryRun) {
    console.log(`Would write ${documents.length} documents.`);

    return;
  }

  const transaction = client.transaction();
  for (const document of documents) transaction.createOrReplace(document);
  const result = await transaction.commit({ tag: 'seed', visibility: 'sync' });

  console.log(`Wrote ${documents.length} documents (transaction ${result.transactionId}).`);
}

await main().catch((error: unknown) => {
  // Client errors can echo request details; print the message only.
  fail(error instanceof Error ? error.message : 'Seed failed.');
});
