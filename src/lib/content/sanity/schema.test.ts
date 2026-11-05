import { schemaTypes } from '../../../../sanity/schema';
import { createFixtureDataset } from '../fixtures/dataset';
import { toSanityDocuments } from './documents';

interface Field {
  fields?: Field[];
  name: string;
  of?: Field[];
  type: string;
}

const registry = new Map(schemaTypes.map((type) => [type.name, type as unknown as Field]));
const builtIn: Record<string, string[]> = {
  image: ['asset', 'hotspot', 'crop'],
  file: ['asset'],
  slug: ['current'],
  reference: ['_ref'],
};

function check(value: unknown, field: Field, at: string, errors: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item: unknown, index) => {
      const itemType =
        item && typeof item === 'object' && '_type' in item ? String(item._type) : undefined;
      const member = field.of?.find((candidate) => candidate.type === itemType) ?? field.of?.[0];

      if (!member) errors.push(`${at}: array without members`);
      else check(item, { ...member, name: `${index}` }, `${at}[${index}]`, errors);
    });

    return;
  }

  if (!value || typeof value !== 'object') return;

  const named = registry.get(field.type);
  const fields = named?.fields ?? field.fields ?? [];
  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith('_') || builtIn[field.type]?.includes(key)) continue;

    const child = fields.find((candidate) => candidate.name === key);

    if (!child) errors.push(`${at}.${key}: not in the Studio schema`);
    else check(entry, child, `${at}.${key}`, errors);
  }
}

describe('sanity/schema.ts', () => {
  it('declares every field the seed writes', () => {
    const errors: string[] = [];
    const documents = toSanityDocuments(createFixtureDataset(), {
      image: () => 'image-asset',
      file: () => 'file-asset',
    });
    for (const document of documents) {
      const type = registry.get(document._type);

      if (!type) errors.push(`${document._type}: no document type`);
      else check(document, type, document._type, errors);
    }
    expect(errors).toEqual([]);
  });

  it('has unique type names', () => {
    expect(registry.size).toBe(schemaTypes.length);
  });
});
