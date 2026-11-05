import { describe, expect, it } from 'vitest';

import { type Command } from './commands/types';
import { addHistory, HISTORY_LIMIT, HistoryNavigator } from './history';
import {
  createRegistry,
  defaultRegistry,
  isRecordable,
  isSecretLine,
  publicCommands,
} from './registry';

describe('addHistory', () => {
  it('trims, skips blanks and immediate repeats', () => {
    expect(addHistory([], '  ls  ')).toEqual(['ls']);
    expect(addHistory(['ls'], 'ls')).toEqual(['ls']);
    expect(addHistory(['ls'], '   ')).toEqual(['ls']);
    expect(addHistory(['ls', 'pwd'], 'ls')).toEqual(['ls', 'pwd', 'ls']);
  });

  it('keeps the most recent 100 entries', () => {
    let entries: string[] = [];
    for (let index = 0; index < HISTORY_LIMIT + 20; index += 1) {
      entries = addHistory(entries, `cmd ${index}`);
    }
    expect(entries).toHaveLength(HISTORY_LIMIT);
    expect(entries.at(-1)).toBe(`cmd ${HISTORY_LIMIT + 19}`);
    expect(entries[0]).toBe('cmd 20');
  });
});

describe('HistoryNavigator', () => {
  it('walks back and forward, restoring the draft', () => {
    const navigator = new HistoryNavigator(['a', 'b', 'c']);

    expect(navigator.up('draft')).toBe('c');
    expect(navigator.up('ignored')).toBe('b');
    expect(navigator.up('')).toBe('a');
    expect(navigator.up('')).toBe('a');
    expect(navigator.down()).toBe('b');
    expect(navigator.down()).toBe('c');
    expect(navigator.down()).toBe('draft');
    expect(navigator.down()).toBeNull();
  });

  it('does nothing without entries', () => {
    expect(new HistoryNavigator([]).up('x')).toBeNull();
  });
});

describe('isRecordable', () => {
  it('keeps secret commands out of history', () => {
    const secret: Command = {
      name: 'hush',
      summaryKey: 'x',
      usageKey: 'x',
      group: 'fun',
      visibility: 'secret',
      async run() {
        return [];
      },
    };
    const registry = createRegistry([...publicCommands, secret]);

    expect(isRecordable(registry, 'help')).toBe(true);
    expect(isRecordable(registry, 'unknown-thing')).toBe(true);
    expect(isRecordable(registry, 'hush now')).toBe(false);
    expect(isRecordable(registry, '   ')).toBe(false);
  });

  it('sees through quoting and escapes of secret names', () => {
    for (const line of ['"su"', "'admin'", "s''u", '\\admin', 'logout now'])
      expect(isRecordable(defaultRegistry, line)).toBe(false);
    expect(isSecretLine(defaultRegistry, '"su"')).toBe(true);
    expect(isSecretLine(defaultRegistry, 'help')).toBe(false);
  });
});
