import { HISTORY_LIMIT } from './history';
import type { Block } from './output';

export const SESSION_KEY = 'jm.terminal.v1';
export const BLOCK_LIMIT = 300;

export interface SavedSession {
  blocks: Block[];
  history: string[];
  cwd: string;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function isBlock(value: unknown): value is Block {
  if (typeof value !== 'object' || value === null) return false;
  const block = value as { id?: unknown; node?: { type?: unknown } };
  return typeof block.id === 'number' && typeof block.node?.type === 'string';
}

/** Anything malformed is discarded: a bad session must never break the terminal. */
export function loadSession(storage: StorageLike): SavedSession | null {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedSession>;
    if (
      !Array.isArray(data.blocks) ||
      !data.blocks.every(isBlock) ||
      !Array.isArray(data.history) ||
      !data.history.every((line) => typeof line === 'string') ||
      typeof data.cwd !== 'string'
    ) {
      return null;
    }
    return { blocks: data.blocks, history: data.history, cwd: data.cwd };
  } catch {
    return null;
  }
}

/**
 * Volatile (secret) blocks, spinners and one-shot typing are never saved.
 * Closing the window passes empty blocks: only the history survives.
 */
export function saveSession(storage: StorageLike, session: SavedSession) {
  const blocks = session.blocks
    .filter((block) => !block.volatile && block.node.type !== 'spinner')
    .slice(-BLOCK_LIMIT)
    .map((block) =>
      block.node.type === 'text' && block.node.typed
        ? { ...block, node: { ...block.node, typed: false } }
        : block,
    );
  try {
    storage.setItem(
      SESSION_KEY,
      JSON.stringify({
        blocks,
        history: session.history.slice(-HISTORY_LIMIT),
        cwd: session.cwd,
      }),
    );
  } catch {
    // Persistence is best effort.
  }
}
