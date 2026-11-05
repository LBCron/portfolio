/**
 * Write-path smoke test against a real Sanity dataset (never production):
 * create, update, conflict, flags, reorder, upload, delete through the same
 * service the admin uses. Leaves the dataset as it found it.
 *
 * Bun run admin:smoke.
 */
import sharp from 'sharp';

import { env } from '@/env';
import { processImage, sniffImage } from '@/lib/admin/upload/image';
import { getAdminStore } from '@/lib/content/admin';
import { createAdminService } from '@/lib/content/admin/service';

const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
const check = (condition: unknown, message: string) => {
  if (!condition) fail(message);

  console.log(`✓ ${message}`);
};

if (env.CONTENT_SOURCE !== 'sanity' && !(env.SANITY_PROJECT_ID && env.SANITY_DATASET)) {
  fail('Set SANITY_PROJECT_ID and SANITY_DATASET (and a write token).');
}

if (env.SANITY_DATASET === 'production') fail('Refusing to run against "production".');

if (!env.SANITY_WRITE_TOKEN) fail('SANITY_WRITE_TOKEN is not set.');

const store = getAdminStore();

check(
  store.source === 'sanity' && !store.readOnlyReason,
  `store is Sanity, writable (${store.label})`,
);

const service = createAdminService(store, {
  revalidate: () => {},
  audit: () => {},
  now: () => new Date(),
});

const label = `Smoke ${Date.now()}`;
let id = '';

try {
  const created = await service.save('practice', null, {
    label: { en: label, pt: `${label} PT` },
    visible: true,
  });

  check(created.ok, 'creates a practice');

  if (!created.ok) process.exit(1);

  id = created.id;

  const loaded = await store.get('practice', id);

  check(
    loaded?.['order'] !== undefined && (loaded.rev ?? '') !== '',
    'reads it back with an order and a revision',
  );

  const bad = await service.save('practice', id, { label: { en: 'x', pt: '' } }, loaded?.rev);

  check(!bad.ok && bad.kind === 'invalid', 'rejects a missing translation');

  const updated = await service.save(
    'practice',
    id,
    { label: { en: `${label} v2`, pt: `${label} v2` }, visible: true },
    loaded?.rev,
  );

  check(updated.ok, 'updates with the loaded revision');

  const stale = await service.save(
    'practice',
    id,
    { label: { en: 'late', pt: 'late' } },
    loaded?.rev,
  );

  check(!stale.ok && stale.kind === 'conflict', 'a stale revision is a conflict');

  const hidden = await service.setFlag('practice', id, 'visible', false);

  check(hidden.ok, 'hides it');
  check((await store.get('practice', id))?.['visible'] === false, 'the flag is stored');

  const all = (await store.list('practice')).map((doc) => doc.id);
  const reordered = await service.reorder('practice', [id, ...all.filter((other) => other !== id)]);

  check(reordered.ok, 'reorders');

  const used = (await store.list('technology'))[0];

  if (used) {
    const refs = await store.referencesTo(used.id);

    console.log(`  (first technology is used by ${refs.length} documents)`);
  }

  const png = await sharp({
    create: { width: 64, height: 48, channels: 3, background: '#4cc9f0' },
  })
    .png()
    .toBuffer();
  const kind = sniffImage(png);
  const processed = await processImage(png, kind ?? 'png', 'smoke test.png');
  const asset = await store.uploadImage(processed.bytes, {
    filename: processed.filename,
    contentType: processed.contentType,
  });

  check(
    /^https:\/\/cdn\.sanity\.io\/images\//.test(asset.url) && asset.width === 64,
    'uploads an image and gets CDN metadata',
  );
} finally {
  if (id) {
    const removed = await service.remove('practice', id);

    check(removed.ok, 'deletes the practice (cleanup)');
  }
}

console.log('Smoke run finished.');
