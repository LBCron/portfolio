'use client';

import { useLocale } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { TERMINAL_ID, terminalTitle } from '@/components/window-manager/terminal-controls';
import { type AppLocale } from '@/i18n/routing';
import { getSessionStatus, type SessionStatus } from '@/lib/auth/actions';
import { isMotionReduced, useReducedMotionPreference } from '@/lib/motion-preference';
import { isApplePlatform, TERMINAL_SHORTCUT } from '@/lib/shortcuts';
import { MARK } from '@/lib/terminal/commands/public/explore';
import { type TerminalEffect } from '@/lib/terminal/commands/types';
import { type AppliedCompletion, applyCompletion, complete } from '@/lib/terminal/completion';
import { buildContext, type EngineDeps, execute } from '@/lib/terminal/engine';
import { type Span, text } from '@/lib/terminal/output';
import { defaultRegistry, isRecordable, isSecretLine } from '@/lib/terminal/registry';
import { loadSession, saveSession } from '@/lib/terminal/session';
import { emptySnapshot } from '@/lib/terminal/snapshot';
import { type Translate } from '@/lib/terminal/vfs';
import { useSessionStore } from '@/stores/session-store';
import { useTerminalStore } from '@/stores/terminal-store';
import { useWindowStore } from '@/stores/window-store';

import { loadTranslator } from './catalog';
import { InputLine } from './input-line';
import { MatrixRain } from './matrix-rain';
import { OutputRenderer } from './output-renderer';
import { loadSnapshot, peekSnapshot } from './snapshot-client';
import { useTerminalActions } from './use-terminal-actions';

const QUICK_COMMANDS = ['help', 'projects', 'skills', 'experience', 'contact', 'resume'];

function promptSpans(cwd: string, admin: boolean): Span[] {
  return [
    { text: `${admin ? 'julio' : 'visitor'}@julio-muller`, tone: 'success' },
    { text: ':', tone: 'dim' },
    { text: cwd, tone: 'accent' },
    admin ? { text: '#', tone: 'error' } : { text: '$', tone: 'dim' },
  ];
}

const applyStatus = (status: SessionStatus): void =>
  useSessionStore
    .getState()
    .set(status.isAdmin ? { expiresAt: status.expiresAt, base: status.base } : null);

/**
 * The terminal body: boot, output log, quick commands and the input line.
 */
export default function TerminalApp(): React.JSX.Element {
  const locale = useLocale() as AppLocale;
  const actions = useTerminalActions();
  const reduced = useReducedMotionPreference();
  const [t, setT] = useState<null | Translate>(null);

  const status = useWindowStore((state) => state.windows[TERMINAL_ID]?.status);
  const windowFocused = useWindowStore((state) => state.windows[TERMINAL_ID]?.focused);
  const blocks = useTerminalStore((state) => state.blocks);
  const cwd = useTerminalStore((state) => state.cwd);
  const running = useTerminalStore((state) => state.running);
  const hydrated = useTerminalStore((state) => state.hydrated);
  const booted = useTerminalStore((state) => state.booted);
  const skipTyping = useTerminalStore((state) => state.skipTyping);
  const history = useTerminalStore((state) => state.history);
  const session = useSessionStore((state) => state.session);
  const admin = session !== null;
  const [secretInput, setSecretInput] = useState(false);
  const [effect, setEffect] = useState<null | TerminalEffect>(null);
  const secretResolverRef = useRef<((value: null | string) => void) | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  // Tapping anywhere in the terminal focuses the input (unless selecting text).
  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const focusInput = (): void => {
      if (!window.getSelection()?.toString()) {
        inputRef.current?.focus({ preventScroll: true });
      }
    };

    root.addEventListener('click', focusInput);

    return (): void => root.removeEventListener('click', focusInput);
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    loadTranslator(locale).then((translator) => {
      if (!cancelled) setT(() => translator);
    });

    return (): void => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    useTerminalStore.getState().hydrate(loadSession(sessionStorage));

    return useTerminalStore.subscribe((state) => {
      if (!state.hydrated) return;

      saveSession(sessionStorage, {
        blocks: state.blocks,
        history: state.history,
        cwd: state.cwd,
      });
    });
  }, []);

  // The window title follows the working directory and the session.
  useEffect(() => {
    useWindowStore.getState().setTitle(TERMINAL_ID, terminalTitle(cwd, admin));
  }, [cwd, admin]);

  // The server owns the session; ask on mount and when the window regains focus.
  useEffect(() => {
    const refresh = (): void => {
      getSessionStatus().then(applyStatus, () => {});
    };

    refresh();

    if (!admin) return;

    window.addEventListener('focus', refresh);

    return (): void => window.removeEventListener('focus', refresh);
  }, [admin]);

  // Boot once per session (not on rehydrate), always while open.
  useEffect(() => {
    if (status !== 'open' || !t || !hydrated || booted) return;

    const store = useTerminalStore.getState();

    store.markBooted();
    store.append({ type: 'ascii', lines: MARK, fallback: 'julio-muller' });
    for (const key of ['terminal.welcome1', 'terminal.welcome2']) {
      store.append({
        type: 'text',
        spans: [{ text: t(key) }],
        typed: !reducedRef.current,
      });
    }
  }, [status, t, hydrated, booted]);

  // Closing the window ends the session: the log goes, the history stays.
  useEffect(() => {
    if (status !== 'closed') return;

    controllerRef.current?.abort();
    useTerminalStore.getState().endSession();
  }, [status]);

  // Focusing the window (open, pointer down) focuses the input.
  useEffect(() => {
    if (status === 'open' && windowFocused) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [status, windowFocused]);

  // When the strings finish loading, do not steal focus the visitor already
  // moved inside the window (for example to the title bar).
  useEffect(() => {
    const active = document.activeElement;
    const idle = !active || active === document.body || active.matches('[data-window]');

    if (t && idle && status === 'open' && windowFocused) {
      inputRef.current?.focus({ preventScroll: true });
    }
    // Only the loading transition matters here.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, [t]);

  useLayoutEffect(() => {
    const log = logRef.current;

    if (log && stickToBottomRef.current) log.scrollTop = log.scrollHeight;
  }, [blocks]);

  function makeDeps(translator: Translate): EngineDeps {
    const state = useTerminalStore.getState();

    return {
      registry: defaultRegistry,
      locale,
      t: translator,
      cwd: state.cwd,
      history: state.history,
      actions: { ...actions, effect: setEffect },
      // Read live: a ref updated by an effect can lag a just-changed setting.
      reducedMotion: isMotionReduced(),
      session: useSessionStore.getState().session,
      loadSecret: () => import('@/lib/terminal/commands/secret'),
      readSecret: (label, signal) =>
        new Promise<null | string>((resolve) => {
          const finish = (value: null | string): void => {
            if (secretResolverRef.current !== finish) return;

            secretResolverRef.current = null;
            setSecretInput(false);
            resolve(value);
          };
          secretResolverRef.current = finish;
          signal.addEventListener('abort', () => finish(null), { once: true });
          useTerminalStore.getState().append(text(label), { volatile: true });
          setSecretInput(true);
        }),
      loadContent: () => loadSnapshot(locale),
      delay: (ms, signal) =>
        reducedRef.current
          ? Promise.resolve()
          : new Promise<void>((resolve, reject) => {
              const timer = window.setTimeout(resolve, ms);

              signal.addEventListener(
                'abort',
                () => {
                  window.clearTimeout(timer);
                  reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true },
              );
            }),
      shortcutLabel: isApplePlatform()
        ? TERMINAL_SHORTCUT.labels.apple
        : TERMINAL_SHORTCUT.labels.other,
    };
  }

  function echo(line: string, suffix = '', volatile = false): void {
    const { cwd: current } = useTerminalStore.getState();

    useTerminalStore.getState().append(
      {
        type: 'text',
        spans: [
          ...promptSpans(current, useSessionStore.getState().session !== null),
          { text: ` ${line}${suffix}` },
        ],
      },
      { volatile },
    );
  }

  async function run(line: string, options?: { multiline: boolean }): Promise<void> {
    const store = useTerminalStore.getState();

    if (!t || store.running) return;

    stickToBottomRef.current = true;
    const trimmed = line.trim();
    // Secret lines and their output are never persisted.
    const volatile = isSecretLine(defaultRegistry, trimmed);

    echo(line, '', volatile);

    if (!trimmed) return;

    if (options?.multiline) store.append(text(t('terminal.pasteMultiline'), 'dim'));

    if (isRecordable(defaultRegistry, trimmed)) store.record(trimmed);

    const controller = new AbortController();
    controllerRef.current = controller;
    store.setRunning(true);

    try {
      for await (const node of execute(trimmed, makeDeps(t), controller.signal)) {
        useTerminalStore.getState().append(node, { volatile });
      }
    } catch {
      if (!controller.signal.aborted) {
        useTerminalStore.getState().append(text(t('terminal.unexpectedError'), 'error'));
      }
    } finally {
      controllerRef.current = null;
      useTerminalStore.getState().endRun();
    }
  }

  function interrupt(line: string): void {
    const store = useTerminalStore.getState();

    if (secretResolverRef.current) {
      secretResolverRef.current(null);
      store.append(text('^C', 'dim'), { volatile: true });
    } else if (controllerRef.current) {
      controllerRef.current.abort();
      store.append(text('^C', 'dim'));
    } else if (line) echo(line, '^C');
  }

  function completeLine(line: string, cursor: number): AppliedCompletion {
    if (!t) return applyCompletion(line, cursor, { start: cursor, candidates: [] });

    const deps = makeDeps(t);
    const ctx = buildContext(
      deps,
      peekSnapshot(locale) ?? emptySnapshot(locale),
      new AbortController().signal,
    );

    return applyCompletion(line, cursor, complete(line, cursor, defaultRegistry, ctx));
  }

  function listCandidates(line: string, candidates: string[]): void {
    echo(line);
    useTerminalStore.getState().append(text(candidates.join('   '), 'accent'));
  }

  if (!t) {
    return <div className="size-full" aria-busy="true" />;
  }

  return (
    <div
      ref={rootRef}
      className="flex size-full flex-col font-mono text-[13px] leading-[1.55] max-[480px]:text-xs"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={logRef}
          role="log"
          aria-label={t('terminal.outputLabel')}
          aria-live="polite"
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex -- a scrollable log must be keyboard reachable
          tabIndex={0}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
        >
          {blocks.map((block) => (
            <OutputRenderer
              key={block.id}
              block={block}
              t={t}
              skipTyping={skipTyping}
              onRun={(command) => {
                run(command);
                inputRef.current?.focus({ preventScroll: true });
              }}
            />
          ))}
        </div>
        {effect === 'matrix' ? <MatrixRain /> : null}
      </div>

      <ul
        aria-label={t('terminal.quickActions')}
        className="flex shrink-0 gap-2 overflow-x-auto border-t border-line px-3 py-1.5"
      >
        {QUICK_COMMANDS.map((command) => (
          <li key={command} className="shrink-0">
            <button
              type="button"
              disabled={running}
              onClick={() => {
                run(command);
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="inline-flex min-h-6 items-center rounded-full border border-line-strong px-2.5 text-accent-2 disabled:opacity-50 pointer-coarse:min-h-9 hover-fine:bg-surface-2"
            >
              {command}
            </button>
          </li>
        ))}
      </ul>

      <div className="shrink-0 border-t border-line px-3 py-2">
        <InputLine
          prompt={[...promptSpans(cwd, admin), { text: ' ' }]}
          secret={secretInput}
          label={
            secretInput
              ? 'Password'
              : t('terminal.inputLabel', {
                  prompt: `${admin ? 'julio' : 'visitor'}@julio-muller:${cwd}${admin ? '#' : '$'}`,
                })
          }
          history={history}
          inputRef={inputRef}
          onSubmit={(line, options) => {
            if (secretResolverRef.current) secretResolverRef.current(line);
            else run(line, options);
          }}
          onInterrupt={interrupt}
          onClear={() => useTerminalStore.getState().clear()}
          onComplete={completeLine}
          onListCandidates={listCandidates}
          onKey={() => {
            if (!useTerminalStore.getState().skipTyping) useTerminalStore.getState().skipBoot();
          }}
        />
      </div>
    </div>
  );
}
