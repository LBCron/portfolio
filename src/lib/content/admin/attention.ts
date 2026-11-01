import type { DocumentType } from '../schema';
import type { AdminDoc } from './types';

export interface AttentionItem {
  type: DocumentType;
  id: string;
  issue: string;
}

type Bag = Record<string, unknown>;
const isBag = (value: unknown): value is Bag =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const blank = (value: unknown) =>
  typeof value !== 'string' || value.trim() === '';

function missingPortuguese(value: unknown): number {
  if (Array.isArray(value))
    return value.reduce<number>((n, item) => n + missingPortuguese(item), 0);
  if (!isBag(value)) return 0;
  const keys = Object.keys(value);
  const localized = keys.every(
    (key) => key === 'en' || key === 'pt' || key === '_type',
  );
  if (localized && !blank(value['en'])) return blank(value['pt']) ? 1 : 0;
  return Object.values(value).reduce<number>(
    (n, item) => n + missingPortuguese(item),
    0,
  );
}

function imagesWithoutAlt(doc: AdminDoc): number {
  const images: unknown[] = [
    doc['photo'],
    doc['photoLg'],
    doc['cover'],
    ...(Array.isArray(doc['gallery']) ? doc['gallery'] : []),
  ];
  return images.filter((image) => {
    if (!isBag(image) || !isBag(image['asset'])) return false;
    const alt = image['alt'];
    return !isBag(alt) || blank(alt['en']) || blank(alt['pt']);
  }).length;
}

const length = (field: unknown, lang: 'en' | 'pt') =>
  isBag(field) && typeof field[lang] === 'string'
    ? (field[lang] as string).trim().length
    : 0;

const words = (field: unknown, lang: 'en' | 'pt') =>
  isBag(field) && typeof field[lang] === 'string'
    ? (field[lang] as string).split(/\s+/).filter(Boolean).length
    : 0;

/** §13.5: a project write-up under this many words reads as thin. */
export const THIN_WORDS = 150;

/** What the dashboard lists under "needs attention" (§12.6, §13.5). */
export function findAttention(
  docs: Partial<Record<DocumentType, AdminDoc[]>>,
  featuredLimit = 6,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const [type, list] of Object.entries(docs) as [
    DocumentType,
    AdminDoc[],
  ][]) {
    for (const doc of list) {
      const add = (issue: string) => items.push({ type, id: doc.id, issue });
      const missing = missingPortuguese(doc);
      if (missing > 0)
        add(
          `${missing} ${missing === 1 ? 'field is' : 'fields are'} missing in Portuguese`,
        );
      const noAlt = imagesWithoutAlt(doc);
      if (noAlt > 0)
        add(
          `${noAlt} ${noAlt === 1 ? 'image has' : 'images have'} no alt text in both languages`,
        );
      if (type === 'project' && doc['visible'] !== false) {
        for (const lang of ['en', 'pt'] as const) {
          const title = length(doc['title'], lang);
          const summary = length(doc['summary'], lang);
          if (title > 60)
            add(`Title (${lang}) is ${title} characters; aim for 60 or fewer`);
          if (summary > 0 && (summary < 70 || summary > 160)) {
            add(`Summary (${lang}) is ${summary} characters; aim for 70–160`);
          }
        }
        const en = words(doc['body'], 'en');
        const pt = words(doc['body'], 'pt');
        if (en < THIN_WORDS || pt < THIN_WORDS) {
          add(
            `Write-up has ${en} words (en) and ${pt} (pt); under ${THIN_WORDS} reads as a thin page`,
          );
        }
      }
    }
  }
  const featured = (docs.project ?? []).filter(
    (doc) => doc['featured'] === true && doc['visible'] !== false,
  );
  if (featured.length > featuredLimit) {
    items.push({
      type: 'project',
      id: '',
      issue: `${featured.length} projects are featured; Home shows ${featuredLimit}`,
    });
  }
  return items;
}
