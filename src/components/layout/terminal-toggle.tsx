'use client';

import { Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { toggleTerminal } from '@/components/window-manager/terminal-controls';
import { cn } from '@/lib/cn';

import { useShortcutLabel } from './use-shortcut-label';

/** The labelled terminal button in the header; its tooltip shows the shortcut. */
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
        className={cn(
          buttonVariants({ variant: 'primary', size: 'sm' }),
          'px-4',
        )}
      >
        <Terminal aria-hidden="true" />
        <span className="md:max-lg:sr-only">{t('buttonLabel')}</span>
      </button>
    </Tooltip>
  );
}
