'use client';

import { Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Kbd } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { toggleTerminal } from '@/components/window-manager/terminal-controls';

import { useShortcutLabel } from './use-shortcut-label';

/** The `>_` button in the header; its tooltip shows the keyboard shortcut. */
export function TerminalToggle() {
  const t = useTranslations('window');
  const shortcut = useShortcutLabel();

  return (
    <Tooltip
      side="bottom"
      content={
        <span className="flex items-center gap-2">
          {t('toggle')} <Kbd>{shortcut}</Kbd>
        </span>
      }
    >
      <button
        type="button"
        aria-label={t('toggle')}
        aria-keyshortcuts="Control+/ Meta+/"
        onClick={toggleTerminal}
        className="inline-flex size-11 items-center justify-center rounded-full border border-line text-text-2 transition-colors hover-fine:border-line-strong hover-fine:text-text-1"
      >
        <Terminal aria-hidden="true" className="size-4" />
      </button>
    </Tooltip>
  );
}
