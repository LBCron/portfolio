import type { CommandContext } from './commands/types';
import type { Registry } from './registry';

export interface Completion {
  /** Index in the line where the word being completed starts. */
  start: number;
  candidates: string[];
}

export function commonPrefix(values: readonly string[]): string {
  const [first = '', ...others] = values;
  let prefix = first;
  for (const value of others) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

/**
 * Completion candidates for the word under the cursor: command names first,
 * then whatever the command offers. Secret commands are never completed.
 */
export function complete(
  line: string,
  cursor: number,
  registry: Registry,
  ctx: CommandContext,
): Completion {
  const before = line.slice(0, cursor);
  const partial = /\S*$/.exec(before)?.[0] ?? '';
  const start = cursor - partial.length;
  const words = before.slice(0, start).split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    const names = registry
      .publicCommands()
      .flatMap((command) => [command.name, ...(command.aliases ?? [])])
      .filter((name) => name.startsWith(partial));
    return { start, candidates: [...new Set(names)].sort() };
  }

  const command = registry.find(words[0] as string);
  if (!command || command.visibility !== 'public') {
    return { start, candidates: [] };
  }
  const candidates = command.complete?.(ctx, words.slice(1), partial) ?? [];
  return { start, candidates: [...new Set(candidates)].sort() };
}

export interface AppliedCompletion {
  line: string;
  cursor: number;
  candidates: string[];
  /** False when nothing could be inserted (a second Tab lists candidates). */
  progressed: boolean;
}

export function applyCompletion(
  line: string,
  cursor: number,
  completion: Completion,
): AppliedCompletion {
  const { start, candidates } = completion;
  const partial = line.slice(start, cursor);
  const unchanged = { line, cursor, candidates, progressed: false };
  if (candidates.length === 0) return unchanged;

  const only = candidates.length === 1 ? (candidates[0] as string) : null;
  const insert = only ?? commonPrefix(candidates);
  if (!only && insert.length <= partial.length) return unchanged;

  const suffix = only && !only.endsWith('/') ? ' ' : '';
  const next = `${line.slice(0, start)}${insert}${suffix}${line.slice(cursor)}`;
  return {
    line: next,
    cursor: start + insert.length + suffix.length,
    candidates,
    progressed: true,
  };
}
