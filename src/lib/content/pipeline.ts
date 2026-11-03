import type { z } from 'zod';

import { contentLogger, type ContentLogger } from './log';
import { documentSchemas, type DocumentOf, type DocumentType } from './schema';

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** GROQ returns `null` for missing fields; the schemas expect them absent. */
export function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null).map(stripNulls);
  }
  if (isPlainObject(value)) {
    const result: PlainObject = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== null && entry !== undefined)
        result[key] = stripNulls(entry);
    }
    return result;
  }
  return value;
}

function isLocalizedObject(value: PlainObject): boolean {
  if (typeof value.en !== 'string') return false;
  return Object.keys(value).every(
    (key) => key === 'en' || key === 'pt' || key === '_type' || key === '_key',
  );
}

/**
 * Read-side fallback: a localized field with an empty `pt` value takes the
 * English text (and is reported), so one missing translation does not hide a
 * whole document. Writes never get this leniency.
 */
export function fillMissingTranslations(
  value: unknown,
  onFallback: (path: string) => void,
  path = '',
): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      fillMissingTranslations(item, onFallback, `${path}[${index}]`),
    );
  }
  if (!isPlainObject(value)) return value;
  if (isLocalizedObject(value)) {
    const en = (value.en as string).trim();
    const pt = typeof value.pt === 'string' ? value.pt.trim() : '';
    if (en && !pt) {
      onFallback(path || '(root)');
      return { ...value, pt: value.en };
    }
    return value;
  }
  const result: PlainObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = fillMissingTranslations(
      entry,
      onFallback,
      path ? `${path}.${key}` : key,
    );
  }
  return result;
}

function documentId(raw: unknown): string {
  return isPlainObject(raw) && typeof raw.id === 'string' ? raw.id : '(no id)';
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.code}`)
    .join('; ');
}

export function parseDocument<T extends DocumentType>(
  type: T,
  raw: unknown,
  logger: ContentLogger = contentLogger,
): DocumentOf<T> | null {
  if (raw === null || raw === undefined) return null;
  const id = documentId(raw);
  const prepared = fillMissingTranslations(stripNulls(raw), (path) =>
    logger.warn('missing-translation', { type, id, path, fallback: 'en' }),
  );
  const result = documentSchemas[type].safeParse(prepared);
  if (!result.success) {
    logger.warn('invalid-document', {
      type,
      id,
      issues: describeIssues(result.error),
    });
    return null;
  }
  return result.data as DocumentOf<T>;
}

interface Ordered {
  id: string;
  order: number;
  visible: boolean;
}

function byOrder(a: Ordered, b: Ordered): number {
  return a.order - b.order || a.id.localeCompare(b.id);
}

/** Valid, visible documents sorted by `order` (ties broken by id). */
export function parseCollection<T extends DocumentType>(
  type: T,
  raws: readonly unknown[] | null | undefined,
  logger: ContentLogger = contentLogger,
): DocumentOf<T>[] {
  const documents: DocumentOf<T>[] = [];
  for (const raw of raws ?? []) {
    const document = parseDocument(type, raw, logger);
    if (document && (document as Ordered).visible !== false) {
      documents.push(document);
    }
  }
  return documents.sort((a, b) => byOrder(a as Ordered, b as Ordered));
}

export interface TechnologyRef {
  id: string;
  visible: boolean;
}

/**
 * Keeps references to visible technologies. Hidden ones are dropped silently;
 * unknown ids are reported.
 */
export function createTechFilter(
  refs: readonly unknown[] | null | undefined,
  logger: ContentLogger = contentLogger,
) {
  const visible = new Set<string>();
  const known = new Set<string>();
  for (const ref of refs ?? []) {
    if (!isPlainObject(ref) || typeof ref.id !== 'string') continue;
    known.add(ref.id);
    if (ref.visible !== false) visible.add(ref.id);
  }
  return (ownerId: string, techIds: readonly string[]): string[] =>
    techIds.filter((techId) => {
      if (!known.has(techId)) {
        logger.warn('unknown-technology', { id: ownerId, techId });
      }
      return visible.has(techId);
    });
}
