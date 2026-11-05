import { create } from 'zustand';

import { addHistory } from '@/lib/terminal/history';
import { type Block, type OutputNode } from '@/lib/terminal/output';
import { type SavedSession } from '@/lib/terminal/session';
import { HOME } from '@/lib/terminal/vfs';

/**
 * Live blocks kept in memory; only the newest 300 are persisted.
 */
const LIVE_LIMIT = 500;

interface TerminalStore {
  append: (node: OutputNode, options?: { volatile?: boolean }) => void;
  blocks: Block[];
  booted: boolean;
  clear: () => void;
  cwd: string;
  /**
   * Ends a run: a spinner nobody replaced would otherwise stay forever.
   */
  endRun: () => void;
  /**
   * The window closed: the log ends, the history stays.
   */
  endSession: () => void;
  history: string[];
  hydrate: (saved: null | SavedSession) => void;
  hydrated: boolean;
  markBooted: () => void;
  nextId: number;
  record: (line: string) => void;
  running: boolean;
  setCwd: (cwd: string) => void;
  setRunning: (running: boolean) => void;
  skipBoot: () => void;
  /**
   * Any key during the boot lines shows them at once.
   */
  skipTyping: boolean;
}

function withoutTrailingSpinner(blocks: Block[]) {
  return blocks.at(-1)?.node.type === 'spinner' ? blocks.slice(0, -1) : blocks;
}

export const useTerminalStore = create<TerminalStore>()((set) => ({
  blocks: [],
  nextId: 1,
  cwd: HOME,
  history: [],
  hydrated: false,
  booted: false,
  running: false,
  skipTyping: false,

  hydrate: (saved) =>
    set((state) => {
      if (state.hydrated) return {};

      if (!saved) return { hydrated: true };

      return {
        hydrated: true,
        blocks: saved.blocks,
        nextId: Math.max(0, ...saved.blocks.map((block) => block.id)) + 1,
        history: saved.history,
        cwd: saved.cwd,
        booted: saved.blocks.length > 0,
      };
    }),

  append: (node, options) =>
    set((state) => {
      const block: Block = {
        id: state.nextId,
        node,
        ...(options?.volatile ? { volatile: true } : {}),
      };

      return {
        nextId: state.nextId + 1,
        blocks: [...withoutTrailingSpinner(state.blocks), block].slice(-LIVE_LIMIT),
      };
    }),

  setRunning: (running) => set({ running }),

  endRun: () =>
    set((state) => ({
      running: false,
      blocks: withoutTrailingSpinner(state.blocks),
    })),

  markBooted: () => set({ booted: true }),
  skipBoot: () => set({ skipTyping: true }),
  clear: () => set({ blocks: [] }),
  setCwd: (cwd) => set({ cwd }),
  record: (line) => set((state) => ({ history: addHistory(state.history, line) })),

  endSession: () =>
    set({
      blocks: [],
      cwd: HOME,
      booted: false,
      running: false,
      skipTyping: false,
    }),
}));
