import { describe, expect, it } from 'vitest';

import { type Block } from './output';
import { BLOCK_LIMIT, loadSession, saveSession, SESSION_KEY } from './session';

function fakeStorage(): {
  data: Map<string, string>;
  getItem: (key: string) => null | string;
  setItem: (key: string, value: string) => void;
} {
  const data = new Map<string, string>();

  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      data.set(key, value);
    },
  };
}

const block = (id: number, extra: Partial<Block> = {}): Block => ({
  id,
  node: { type: 'text', spans: [{ text: `line ${id}` }] },
  ...extra,
});

describe('terminal session', () => {
  it('round-trips blocks, history and cwd', () => {
    const storage = fakeStorage();

    saveSession(storage, { blocks: [block(1)], history: ['ls'], cwd: '~/x' });
    expect(loadSession(storage)).toEqual({
      blocks: [block(1)],
      history: ['ls'],
      cwd: '~/x',
    });
  });

  it('never saves volatile blocks, spinners or typing state', () => {
    const storage = fakeStorage();

    saveSession(storage, {
      blocks: [
        block(1),
        block(2, { volatile: true }),
        { id: 3, node: { type: 'spinner', label: 'x' } },
        { id: 4, node: { type: 'text', spans: [{ text: 'hi' }], typed: true } },
      ],
      history: [],
      cwd: '~',
    });

    const saved = loadSession(storage)!;

    expect(saved.blocks.map((b) => b.id)).toEqual([1, 4]);
    expect(saved.blocks[1]!.node).toMatchObject({ typed: false });
    expect(storage.data.get(SESSION_KEY)).not.toContain('volatile');
  });

  it('caps blocks at 300 and keeps the newest', () => {
    const storage = fakeStorage();
    const blocks = Array.from({ length: BLOCK_LIMIT + 50 }, (_, i) => block(i));

    saveSession(storage, { blocks, history: [], cwd: '~' });

    const saved = loadSession(storage)!;

    expect(saved.blocks).toHaveLength(BLOCK_LIMIT);
    expect(saved.blocks.at(-1)!.id).toBe(BLOCK_LIMIT + 49);
  });

  it('keeps only the history when the window was closed', () => {
    const storage = fakeStorage();

    saveSession(storage, { blocks: [], history: ['help'], cwd: '~' });
    expect(loadSession(storage)).toEqual({
      blocks: [],
      history: ['help'],
      cwd: '~',
    });
  });

  it('discards malformed data', () => {
    const storage = fakeStorage();

    expect(loadSession(storage)).toBeNull();
    storage.data.set(SESSION_KEY, '{nope');
    expect(loadSession(storage)).toBeNull();
    storage.data.set(SESSION_KEY, JSON.stringify({ blocks: [{ id: 'x' }], history: [], cwd: '~' }));
    expect(loadSession(storage)).toBeNull();
    storage.data.set(SESSION_KEY, JSON.stringify({ blocks: [], history: [1], cwd: '~' }));
    expect(loadSession(storage)).toBeNull();
  });
});
