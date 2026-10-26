export type Tone =
  'default' | 'dim' | 'bold' | 'accent' | 'success' | 'warn' | 'error' | 'link';

export interface Span {
  text: string;
  tone?: Tone;
}

export interface KvItem {
  key: string;
  value: string;
  /** Renders the key as a chip that runs this command. */
  command?: string;
}

export interface LinkItem {
  label: string;
  /** Internal paths have no locale prefix (`/projects/x`). */
  href: string;
  external?: boolean;
  note?: string;
}

/**
 * Terminal output is data, never HTML strings: it stays safe, localizable and
 * serializable for sessionStorage.
 */
export type OutputNode =
  | { type: 'text'; spans: Span[]; typed?: boolean }
  | { type: 'link'; items: LinkItem[] }
  | { type: 'command'; items: { command: string; label?: string }[] }
  | { type: 'table'; head?: string[]; rows: string[][] }
  | { type: 'tree'; lines: string[] }
  | { type: 'kv'; items: KvItem[] }
  | { type: 'ascii'; lines: string[]; fallback?: string }
  | { type: 'spinner'; label: string }
  | { type: 'blank' };

/** A rendered node with a stable id; `volatile` blocks are never persisted. */
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
