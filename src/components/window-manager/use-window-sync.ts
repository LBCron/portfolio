'use client';

import { useEffect } from 'react';
import { z } from 'zod';

import { useWindowStore } from '@/stores/window-store';

const savedSchema = z.object({
  status: z.enum(['open', 'minimized']),
  maximized: z.boolean(),
  rect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
});

/**
 * Keeps the store's viewport current and persists one window to
 * sessionStorage. Rehydration happens after mount to avoid a hydration
 * mismatch; a closed window is not persisted, so it stays unmounted.
 */
export function useWindowSync(id: string, title: string) {
  useEffect(() => {
    const key = `jm.window.${id}.v1`;
    const store = useWindowStore.getState();

    const updateViewport = () => {
      const top = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--header-height',
        ),
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
      const saved = raw ? savedSchema.safeParse(JSON.parse(raw)) : null;
      if (saved?.success) store.hydrate(id, title, saved.data);
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
          sessionStorage.setItem(
            key,
            JSON.stringify({ status, maximized, rect }),
          );
        }
      } catch {
        // Persistence is best effort.
      }
    });

    return () => {
      window.removeEventListener('resize', updateViewport);
      unsubscribe();
    };
  }, [id, title]);
}
