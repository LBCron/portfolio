'use client';

import {
  type ClipboardEvent,
  type KeyboardEvent,
  type SyntheticEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';
import { type AppliedCompletion } from '@/lib/terminal/completion';
import { HistoryNavigator } from '@/lib/terminal/history';
import { type Span } from '@/lib/terminal/output';

import { TONE_CLASS } from './output-renderer';

interface InputLineProps {
  history: readonly string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  onClear: () => void;
  onComplete: (line: string, cursor: number) => AppliedCompletion;
  /**
   * Ctrl+C: aborts a running command, or discards the typed line.
   */
  onInterrupt: (line: string) => void;
  /**
   * Any key press (skips the boot typing).
   */
  onKey: () => void;
  onListCandidates: (line: string, candidates: string[]) => void;
  onSubmit: (line: string, options?: { multiline: boolean }) => void;
  prompt: Span[];
  /**
   * Secret-input mode: nothing is echoed and no caret is drawn.
   */
  secret?: boolean;
}

/**
 * A hidden native <input> takes the real typing (IME, paste, mobile keyboards);
 * the visible line and block caret are mirrored from it.
 */
export function InputLine(props: InputLineProps) {
  const { inputRef } = props;
  const [value, setValue] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [inputFocused, setInputFocused] = useState(false);
  const navigator = useRef<HistoryNavigator | null>(null);
  const tabPending = useRef(false);
  const pendingCaret = useRef<null | number>(null);

  useLayoutEffect(() => {
    if (pendingCaret.current === null) return;

    inputRef.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  }, [value, selection, inputRef]);

  function edit(next: string, caret: number): void {
    pendingCaret.current = caret;
    setValue(next);
    setSelection({ start: caret, end: caret });
  }

  function syncSelection(event: SyntheticEvent<HTMLInputElement>): void {
    const { selectionStart, selectionEnd } = event.currentTarget;

    setSelection({ start: selectionStart ?? 0, end: selectionEnd ?? 0 });
  }

  function submit(line: string, multiline = false): void {
    navigator.current = null;
    edit('', 0);
    props.onSubmit(line, { multiline });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.nativeEvent.isComposing) return;

    props.onKey();

    if (event.key !== 'Tab') tabPending.current = false;

    const caret = event.currentTarget.selectionStart ?? value.length;
    const ctrl = event.ctrlKey && !event.metaKey && !event.altKey;

    if (props.secret) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submit(value);
      } else if (ctrl && event.key === 'c') {
        event.preventDefault();
        props.onInterrupt('');
        edit('', 0);
      }

      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      submit(value);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      navigator.current ??= new HistoryNavigator(props.history);
      const next = event.key === 'ArrowUp' ? navigator.current.up(value) : navigator.current.down();

      if (next !== null) edit(next, next.length);
    } else if (event.key === 'Tab' && !event.shiftKey && value.trim()) {
      const applied = props.onComplete(value, caret);

      if (applied.candidates.length === 0) return; // let Tab leave the window

      event.preventDefault();

      if (applied.progressed) {
        tabPending.current = false;
        edit(applied.line, applied.cursor);
      } else if (applied.candidates.length > 1) {
        if (tabPending.current) {
          tabPending.current = false;
          props.onListCandidates(value, applied.candidates);
        } else tabPending.current = true;
      }
    } else if (ctrl && event.key === 'a') {
      event.preventDefault();
      edit(value, 0);
    } else if (ctrl && event.key === 'e') {
      event.preventDefault();
      edit(value, value.length);
    } else if (ctrl && event.key === 'u') {
      event.preventDefault();
      edit(value.slice(caret), 0);
    } else if (ctrl && event.key === 'k') {
      event.preventDefault();
      edit(value.slice(0, caret), caret);
    } else if (ctrl && event.key === 'w') {
      event.preventDefault();

      const kept = value.slice(0, caret).replace(/\S+\s*$/, '');

      edit(kept + value.slice(caret), kept.length);
    } else if (ctrl && event.key === 'l') {
      event.preventDefault();
      props.onClear();
    } else if (ctrl && event.key === 'c') {
      event.preventDefault();
      props.onInterrupt(value);
      navigator.current = null;
      edit('', 0);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    if (props.secret) return;

    const pasted = event.clipboardData.getData('text');

    if (!/[\r\n]/.test(pasted)) return;

    event.preventDefault();

    const first = pasted.split(/\r?\n/)[0] ?? '';
    const { start, end } = selection;

    submit(value.slice(0, start) + first + value.slice(end), true);
  }

  const { start, end } = selection;
  const collapsed = start === end;
  const caretChar = collapsed ? (value[start] ?? ' ') : '';

  return (
    <div className="relative flex min-h-6 items-start gap-2 rounded-sm has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-2">
      <span aria-hidden="true" className={cn('shrink-0 whitespace-pre', props.secret && 'hidden')}>
        {props.prompt.map((span, index) => (
          <span key={index} className={TONE_CLASS[span.tone ?? 'default']}>
            {span.text}
          </span>
        ))}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'min-w-0 flex-1 break-all whitespace-pre-wrap text-text-1',
          props.secret && 'hidden',
        )}
      >
        {value.slice(0, start)}
        {collapsed ? (
          <span
            data-caret
            data-active={inputFocused}
            className={cn(
              'inline-block min-w-[1ch]',
              inputFocused ? 'bg-text-1 text-bg-0' : 'outline-1 -outline-offset-1 outline-text-2',
            )}
          >
            {caretChar}
          </span>
        ) : (
          <mark className="bg-accent-2/40 text-text-1">{value.slice(start, end)}</mark>
        )}
        {collapsed ? value.slice(start + 1) : value.slice(end)}
      </span>
      <input
        ref={inputRef}
        value={value}
        type={props.secret ? 'password' : 'text'}
        aria-label={props.label}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="send"
        onChange={(event) => {
          setValue(event.target.value);
          syncSelection(event);
        }}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        className="absolute inset-0 size-full cursor-text bg-transparent text-[16px] text-transparent opacity-0 outline-none"
      />
    </div>
  );
}
