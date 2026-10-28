/** Fixed-window counter; `true` while `key` is under `max` hits per window. */
export function createWindowCounter(
  max: number,
  windowMs: number,
  now = Date.now,
) {
  const windows = new Map<string, { start: number; count: number }>();
  return (key: string): boolean => {
    const time = now();
    const current = windows.get(key);
    if (!current || time - current.start >= windowMs) {
      windows.set(key, { start: time, count: 1 });
      if (windows.size > 1000) windows.clear();
      return true;
    }
    current.count += 1;
    return current.count <= max;
  };
}
