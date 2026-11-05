'use client';

import { useSyncExternalStore } from 'react';

import { isApplePlatform, TERMINAL_SHORTCUT } from '@/lib/shortcuts';

const subscribe = () => () => {};

/**
 * `Ctrl /` or `⌘ /`; the server renders the generic form.
 */
export function useShortcutLabel() {
  return useSyncExternalStore(
    subscribe,
    () => (isApplePlatform() ? TERMINAL_SHORTCUT.labels.apple : TERMINAL_SHORTCUT.labels.other),
    () => TERMINAL_SHORTCUT.labels.other,
  );
}
