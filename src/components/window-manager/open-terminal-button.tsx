'use client';

import { Terminal } from 'lucide-react';

import { openTerminal } from './terminal-controls';

/** Hero text button: opens (or restores, or focuses) the terminal. */
export function OpenTerminalButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={openTerminal}
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-small text-text-2 underline-offset-4 hover-fine:text-text-1 hover-fine:underline"
    >
      <Terminal aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}
