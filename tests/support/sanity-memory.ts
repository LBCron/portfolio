import { evaluate, parse } from 'groq-js';
import { createHash } from 'node:crypto';

import { type FixtureDataset } from '@/lib/content/fixtures/dataset';
import { FIXTURE_UPDATED_AT } from '@/lib/content/fixtures/helpers';
import { type SanityDocument, toSanityDocuments } from '@/lib/content/sanity/documents';
import { type GroqFetch } from '@/lib/content/sanity/source';
import { type FileAsset, type ImageAsset } from '@/lib/content/schema';

const sha1 = (value: string) => createHash('sha1').update(value).digest('hex');

/**
 * A Content Lake stand-in: the fixture dataset converted to Sanity storage
 * documents plus synthesized asset documents, queried with groq-js.
 */
export function createSanityMemoryDataset(dataset: FixtureDataset): SanityDocument[] {
  const assets = new Map<string, SanityDocument>();

  const resolver = {
    image(asset: ImageAsset) {
      const id = `image-${sha1(asset.url)}-${asset.width}x${asset.height}-webp`;

      assets.set(id, {
        _id: id,
        _type: 'sanity.imageAsset',
        url: asset.url,
        metadata: {
          _type: 'sanity.imageMetadata',
          dimensions: {
            _type: 'sanity.imageDimensions',
            width: asset.width,
            height: asset.height,
          },
          lqip: asset.lqip,
        },
      });

      return id;
    },
    file(asset: FileAsset) {
      const id = `file-${sha1(asset.url)}-pdf`;

      assets.set(id, {
        _id: id,
        _type: 'sanity.fileAsset',
        url: asset.url,
        size: asset.size,
        mimeType: asset.mimeType,
      });

      return id;
    },
  };

  const documents = toSanityDocuments(dataset, resolver).map((document) => ({
    ...document,
    _rev: 'fixture',
    _updatedAt: FIXTURE_UPDATED_AT,
  }));

  return [...documents, ...assets.values()];
}

export function createMemoryGroqFetch(
  documents: readonly SanityDocument[],
  onQuery?: (query: string, tags: readonly string[]) => void,
): GroqFetch {
  return async (query, params, tags) => {
    onQuery?.(query, tags);

    const tree = parse(query, { params });
    const value = await evaluate(tree, { dataset: [...documents], params });

    return value.get();
  };
}
