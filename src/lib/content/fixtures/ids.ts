import { createHash } from 'node:crypto';

import { type DocumentType } from '../schema';

/**
 * Stable `<type>.<uuid>` id for a fixture document, derived from a readable key
 * so the seed stays idempotent and references can be written by name.
 */
export function fixtureId(type: DocumentType, key: string): string {
  const hex = createHash('sha1').update(`${type}:${key}`).digest('hex');
  const variant = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');
  const uuid = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');

  return `${type}.${uuid}`;
}

export const techId = (name: string): string => fixtureId('technology', name);
