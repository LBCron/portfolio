'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { isTerminalShortcut } from '@/lib/shortcuts';
import { useWindowStore } from '@/stores/window-store';

import { useWindowSync } from './use-window-sync';
import { WindowFrame } from './window-frame';

const ID = 'terminal';
const TITLE = 'visitor@julio-muller: ~';

function toggleTerminal() {
  const store = useWindowStore.getState();
  const win = store.windows[ID];
  if (!win || win.status === 'closed') store.open(ID, TITLE);
  else if (win.status === 'minimized') store.restore(ID);
  else if (win.focused) store.minimize(ID);
  else store.focus(ID);
}

function isTypingOutsideWindow(target: EventTarget | null) {
  if (!(target instanceof HTMLElement) || target.closest('[data-window]')) {
    return false;
  }
  return (
    target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
  );
}

/** The first window of the manager. Phase 6 replaces the placeholder body. */
export function TerminalWindow() {
  const t = useTranslations('terminal');
  const win = useWindowStore((state) => state.windows[ID]);
  useWindowSync(ID, TITLE);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTerminalShortcut(event) || isTypingOutsideWindow(event.target)) {
        return;
      }
      event.preventDefault();
      toggleTerminal();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-window]')) {
        useWindowStore.getState().blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  if (!win) return null;

  return (
    <>
      <WindowFrame
        id={ID}
        title={win.title}
        labels={{
          window: t('windowLabel'),
          controls: t('controls'),
          hint: t('controlsHint'),
          close: t('close'),
          minimize: t('minimize'),
          maximize: t('maximize'),
          restore: t('restore'),
          resizeSheet: t('resizeSheet'),
        }}
      >
        <p className="p-4 font-mono text-[13px] text-text-2">
          {t('comingSoon')}
        </p>
      </WindowFrame>
      {win.status === 'open' ? null : (
        <button
          type="button"
          aria-keyshortcuts="Control+/ Meta+/"
          onClick={toggleTerminal}
          className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-(--z-dock) inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface-1 px-4 font-mono text-small text-text-1"
        >
          <span aria-hidden="true">&gt;_</span>
          {t('dock')}
          {win.status === 'minimized' ? (
            <>
              <span
                aria-hidden="true"
                data-dock-activity
                className="size-2 rounded-full bg-term-green"
              />
              <span className="sr-only">{t('dockMinimized')}</span>
            </>
          ) : null}
        </button>
      )}
    </>
  );
}
