/**
 * Ctrl/Cmd + / toggles the terminal. `/` is unshifted on Brazilian ABNT2
 * keyboards, unlike the backtick.
 */
export const TERMINAL_SHORTCUT = {
  key: '/',
  labels: { apple: '⌘ /', other: 'Ctrl /' },
} as const;

export function isTerminalShortcut(event: KeyboardEvent) {
  return (
    event.key === TERMINAL_SHORTCUT.key
    && (event.metaKey || event.ctrlKey)
    && !event.altKey
    && !event.shiftKey
  );
}

export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;

  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}
