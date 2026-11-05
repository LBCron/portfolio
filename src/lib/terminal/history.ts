export const HISTORY_LIMIT = 100;

/**
 * Appends a line; blank lines and immediate repeats are skipped.
 */
export function addHistory(
  entries: readonly string[],
  line: string,
  limit = HISTORY_LIMIT,
): string[] {
  const trimmed = line.trim();

  if (!trimmed || entries.at(-1) === trimmed) return [...entries];

  return [...entries, trimmed].slice(-limit);
}

/**
 * Up/down navigation that keeps the partially typed line as a draft.
 */
export class HistoryNavigator {
  private index: number;
  private draft = '';

  constructor(private readonly entries: readonly string[]) {
    this.index = entries.length;
  }

  up(current: string): null | string {
    if (this.entries.length === 0) return null;

    if (this.index === this.entries.length) this.draft = current;

    if (this.index > 0) this.index -= 1;

    return this.entries[this.index] ?? null;
  }

  down(): null | string {
    if (this.index >= this.entries.length) return null;

    this.index += 1;

    return this.index === this.entries.length ? this.draft : (this.entries[this.index] ?? null);
  }
}
