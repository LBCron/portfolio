import { useWindowStore } from '@/stores/window-store';

export const TERMINAL_ID = 'terminal';

export function terminalTitle(cwd: string, admin = false) {
  return `${admin ? 'julio' : 'visitor'}@julio-muller: ${cwd}`;
}

/**
 * Shortcut and header button: open, restore, or minimize when focused.
 */
export function toggleTerminal() {
  const store = useWindowStore.getState();
  const win = store.windows[TERMINAL_ID];

  if (!win || win.status === 'closed') store.open(TERMINAL_ID, terminalTitle('~'));
  else if (win.status === 'minimized') store.restore(TERMINAL_ID);
  else if (win.focused) store.minimize(TERMINAL_ID);
  else store.focus(TERMINAL_ID);
}

/**
 * CTAs never minimize: open, restore or just focus.
 */
export function openTerminal() {
  const store = useWindowStore.getState();
  const win = store.windows[TERMINAL_ID];

  if (!win || win.status === 'closed') store.open(TERMINAL_ID, terminalTitle('~'));
  else if (win.status === 'minimized') store.restore(TERMINAL_ID);
  else store.focus(TERMINAL_ID);
}
