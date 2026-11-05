import { create } from 'zustand';

import {
  clampRect,
  defaultRect,
  type Rect,
  type ResizeEdge,
  resizeRect,
  snapRect,
  type SnapSide,
  type Viewport,
} from '@/lib/window-manager/geometry';

export interface WindowState {
  focused: boolean;
  id: string;
  maximized: boolean;
  /**
   * Restored geometry, px.
   */
  rect: Rect;
  status: 'closed' | 'minimized' | 'open';
  title: string;
  zIndex: number;
}

interface WindowStore {
  blur: () => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  hydrate: (
    id: string,
    title: string,
    saved: Pick<WindowState, 'maximized' | 'rect' | 'status'>,
  ) => void;
  minimize: (id: string) => void;
  moveTo: (id: string, x: number, y: number) => void;
  open: (id: string, title: string) => void;
  resizeBy: (id: string, edge: ResizeEdge, dx: number, dy: number) => void;
  resizeTo: (id: string, rect: Rect) => void;
  restore: (id: string) => void;
  setTitle: (id: string, title: string) => void;
  setViewport: (viewport: Viewport) => void;
  snap: (id: string, side: SnapSide) => void;
  toggleMaximize: (id: string) => void;
  viewport: Viewport;
  windows: Record<string, WindowState>;
  zCounter: number;
}

function patch(state: WindowStore, id: string, change: Partial<WindowState>): Partial<WindowStore> {
  const current = state.windows[id];

  if (!current) return {};

  return { windows: { ...state.windows, [id]: { ...current, ...change } } };
}

/**
 * Raises one window above the others and blurs the rest.
 */
function raise(state: WindowStore, id: string): Partial<WindowStore> {
  const current = state.windows[id];

  if (!current) return {};

  const topmost = Math.max(...Object.values(state.windows).map((w) => w.zIndex));
  const zIndex =
    current.zIndex === topmost && current.focused ? current.zIndex : state.zCounter + 1;
  const windows = Object.fromEntries(
    Object.entries(state.windows).map(([key, win]) => [
      key,
      key === id ? { ...win, zIndex, focused: true } : { ...win, focused: false },
    ]),
  );

  return { windows, zCounter: Math.max(state.zCounter, zIndex) };
}

export const useWindowStore = create<WindowStore>()((set) => ({
  windows: {},
  viewport: { width: 0, height: 0, top: 0 },
  zCounter: 0,

  setViewport: (viewport) =>
    set((state) => ({
      viewport,
      windows: Object.fromEntries(
        Object.entries(state.windows).map(([id, win]) => [
          id,
          { ...win, rect: clampRect(win.rect, viewport) },
        ]),
      ),
    })),

  hydrate: (id, title, saved) =>
    set((state) => {
      if (state.windows[id]) return {};

      const win: WindowState = {
        id,
        title,
        ...saved,
        rect: clampRect(saved.rect, state.viewport),
        zIndex: state.zCounter,
        focused: false,
      };

      return { windows: { ...state.windows, [id]: win } };
    }),

  open: (id, title) =>
    set((state) => {
      const existing = state.windows[id];
      const base: WindowState = existing ?? {
        id,
        title,
        status: 'open',
        maximized: false,
        rect: defaultRect(state.viewport),
        zIndex: 0,
        focused: false,
      };
      const next = {
        ...state,
        windows: {
          ...state.windows,
          [id]: { ...base, status: 'open' as const },
        },
      };

      return raise(next, id);
    }),

  close: (id) => set((state) => patch(state, id, { status: 'closed', focused: false })),

  minimize: (id) => set((state) => patch(state, id, { status: 'minimized', focused: false })),

  restore: (id) =>
    set((state) =>
      raise(
        {
          ...state,
          windows: {
            ...state.windows,
            ...(state.windows[id]
              ? { [id]: { ...state.windows[id], status: 'open' as const } }
              : {}),
          },
        },
        id,
      ),
    ),

  toggleMaximize: (id) =>
    set((state) => {
      const win = state.windows[id];

      return win ? patch(state, id, { maximized: !win.maximized }) : {};
    }),

  focus: (id) => set((state) => raise(state, id)),

  setTitle: (id, title) => set((state) => patch(state, id, { title })),

  blur: () =>
    set((state) => ({
      windows: Object.fromEntries(
        Object.entries(state.windows).map(([id, win]) => [id, { ...win, focused: false }]),
      ),
    })),

  moveTo: (id, x, y) =>
    set((state) => {
      const win = state.windows[id];

      if (!win) return {};

      return patch(state, id, {
        rect: clampRect({ ...win.rect, x, y }, state.viewport),
      });
    }),

  resizeTo: (id, rect) =>
    set((state) => patch(state, id, { rect: clampRect(rect, state.viewport) })),

  resizeBy: (id, edge, dx, dy) =>
    set((state) => {
      const win = state.windows[id];

      if (!win) return {};

      return patch(state, id, {
        rect: resizeRect(win.rect, edge, dx, dy, state.viewport),
      });
    }),

  snap: (id, side) =>
    set((state) =>
      side === 'top'
        ? patch(state, id, { maximized: true })
        : patch(state, id, {
            maximized: false,
            rect: snapRect(side, state.viewport),
          }),
    ),
}));
