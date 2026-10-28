import type {
  DocumentOf,
  DocumentType,
  FileAsset,
  ImageAsset,
} from '../schema';

/**
 * What the admin reads: the schema shape without validation, so a document
 * that fails it (a missing translation, say) can still be opened and fixed.
 */
export type AdminDoc = Record<string, unknown> & {
  id: string;
  rev?: string;
  updatedAt?: string;
  isFixture?: boolean;
};

export type WriteResult =
  | { ok: true; rev: string }
  | { ok: false; reason: 'conflict' | 'missing' | 'exists' };

export interface Reference {
  type: string;
  id: string;
  label: string;
}

export interface UploadMeta {
  filename: string;
  contentType: string;
}

export interface AdminStore {
  readonly source: 'sanity' | 'fixtures';
  /** Why writes are off, or `null` when they work. */
  readonly readOnlyReason: string | null;
  /** The top-bar badge. */
  readonly label: string;

  /** Every document of the type, hidden included, ordered. */
  list(type: DocumentType): Promise<AdminDoc[]>;
  get(type: DocumentType, id: string): Promise<AdminDoc | null>;

  write<T extends DocumentType>(
    type: T,
    document: DocumentOf<T>,
    options: { isNew: boolean; expectedRev?: string | undefined },
  ): Promise<WriteResult>;
  /** Small top-level changes (`visible`, `featured`, `order`) with no revalidation of the rest. */
  patch(
    type: DocumentType,
    id: string,
    fields: Record<string, unknown>,
    expectedRev?: string,
  ): Promise<WriteResult>;
  remove(
    type: DocumentType,
    id: string,
    expectedRev?: string,
  ): Promise<WriteResult>;
  /** Documents that refer to `id` (technologies in use). */
  referencesTo(id: string): Promise<Reference[]>;

  uploadImage(bytes: Buffer, meta: UploadMeta): Promise<ImageAsset>;
  uploadFile(bytes: Buffer, meta: UploadMeta): Promise<FileAsset>;
}
