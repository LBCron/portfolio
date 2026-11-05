export type Tone = 'accent' | 'bold' | 'default' | 'dim' | 'error' | 'link' | 'success' | 'warn';

export interface Span {
  text: string;
  tone?: Tone;
}

export interface KvItem {
  /**
   * Renders the key as a chip that runs this command.
   */
  command?: string;
  key: string;
  value: string;
}

export interface LinkItem {
  external?: boolean;
  /**
   * Internal paths have no locale prefix (`/projects/x`).
   */
  href: string;
  label: string;
  note?: string;
}

/**
 * Terminal output is data, never HTML strings: it stays safe, localizable and
 * serializable for sessionStorage.
 */
export type OutputNode =
  | {
      fallback?: string;
      /**
       * Meaningful art: read as an image with this name, shown when narrow.
       */
      label?: string;
      lines: string[];
      type: 'ascii';
    }
  | { head?: string[]; rows: string[][]; type: 'table' }
  | { items: Array<{ command: string; label?: string }>; type: 'command' }
  | { items: KvItem[]; type: 'kv' }
  | { items: LinkItem[]; type: 'link' }
  | { label: string; type: 'spinner' }
  | { lines: string[]; type: 'tree' }
  | { spans: Span[]; type: 'text'; typed?: boolean }
  | { type: 'blank' };

/**
 * A rendered node with a stable id; `volatile` blocks are never persisted.
 */
export interface Block {
  id: number;
  node: OutputNode;
  volatile?: boolean;
}

export const text = (content: string, tone?: Tone): OutputNode => ({
  type: 'text',
  spans: [tone ? { text: content, tone } : { text: content }],
});

export const spans = (...parts: Span[]): OutputNode => ({
  type: 'text',
  spans: parts,
});

export const blank = (): OutputNode => ({ type: 'blank' });
