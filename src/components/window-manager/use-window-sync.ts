'use client';

import { useEffect } from 'react';

import { type Rect } from '@/lib/window-manager/geometry';
import { useWindowStore } from '@/stores/window-store';

interface Saved {
  maximized: boolean;
  rect: Rect;
  status: 'minimized' | 'open';
}

const isNumber = (value: unknown): boolean => typeof value === 'number' && Number.isFinite(value);

/**
 * Hand-written instead of zod: zod would add its whole runtime to the initial
 * public bundle, and its JIT probe (`new Function`) trips the CSP (D56).
 */
export function parseSaved(value: unknown): null | Saved {
  if (typeof value !== 'object' || value === null) return null;

  const { status, maximized, rect } = value as Record<string, unknown>;

  if (status !== 'open' && status !== 'minimized') return null;

  if (typeof maximized !== 'boolean') return null;

  if (typeof rect !== 'object' || rect === null) return null;

  const { x, y, width, height } = rect as Record<string, unknown>;

  if (![x, y, width, height].every(isNumber)) return null;

  return {
    status,
    maximized,
    rect: {
      x: x as number,
      y: y as number,
      width: width as number,
      height: height as number,
    },
  };
}

/**
 * Keeps the store's viewport current and persists one window to sessionStorage.
 * Rehydration happens after mount to avoid a hydration mismatch; a closed
 * window is not persisted, so it stays unmounted.
 */
export function useWindowSync(id: string, title: string): void {
  useEffect(() => {
    const key = `jm.window.${id}.v1`;
    const store = useWindowStore.getState();

    const updateViewport = (): void => {
      const top = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      );

      useWindowStore.getState().setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        top: Number.isFinite(top) ? top : 0,
      });
    };

    updateViewport();

    try {
      const raw = sessionStorage.getItem(key);
      const saved = raw ? parseSaved(JSON.parse(raw)) : null;

      if (saved) store.hydrate(id, title, saved);
    } catch {
      // Storage unavailable or corrupt: start from defaults.
    }

    window.addEventListener('resize', updateViewport);

    const unsubscribe = useWindowStore.subscribe((state) => {
      const win = state.windows[id];

      if (!win) return;

      try {
        if (win.status === 'closed') sessionStorage.removeItem(key);
        else {
          const { status, maximized, rect } = win;

          sessionStorage.setItem(key, JSON.stringify({ status, maximized, rect }));
        }
      } catch {
        // Persistence is best effort.
      }
    });

    return (): void => {
      window.removeEventListener('resize', updateViewport);
      unsubscribe();
    };
  }, [id, title]);
}
