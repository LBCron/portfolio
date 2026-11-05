import { type DocumentType, type FileAsset, type ImageAsset, type LocalizedText } from '../schema';
import { fixtureFileAssets, fixtureImageAssets } from './assets.generated';
import { fixtureId } from './ids';
import { type FixtureImageKey, type FixturePdfKey } from './image-specs';

/**
 * Fixed so fixture output is deterministic (Sanity sets its own on seed).
 */
export const FIXTURE_UPDATED_AT = '2026-10-01T12:00:00Z';

export function L(en: string, pt: string): LocalizedText {
  return { en, pt };
}

export function meta(type: DocumentType, key: string) {
  return {
    id: fixtureId(type, key),
    rev: 'fixture',
    updatedAt: FIXTURE_UPDATED_AT,
    isFixture: true,
  };
}

export function singletonMeta<T extends 'contact' | 'profile' | 'resume'>(type: T) {
  return {
    id: type,
    rev: 'fixture',
    updatedAt: FIXTURE_UPDATED_AT,
    isFixture: true,
  };
}

function required<T>(value: T | undefined, key: string): T {
  if (value === undefined) {
    throw new Error(`Fixture asset "${key}" is missing; run bun run fixtures:generate`);
  }

  return value;
}

const imageAsset = (key: FixtureImageKey): ImageAsset => required(fixtureImageAssets[key], key);

export function fixtureImage(
  key: FixtureImageKey,
  alt: LocalizedText,
  focal?: { x: number; y: number },
) {
  return { asset: imageAsset(key), alt, ...(focal ? { focal } : {}) };
}

export function fixtureAvatar(key: FixtureImageKey) {
  return { asset: imageAsset(key) };
}

export function fixtureFile(key: FixturePdfKey): FileAsset {
  return required(fixtureFileAssets[key], key);
}
