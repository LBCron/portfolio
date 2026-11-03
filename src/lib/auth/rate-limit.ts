const MINUTE = 60_000;
const WINDOW_MS = 15 * MINUTE;
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * MINUTE;
const MAX_LOCKOUT_MS = 24 * 60 * MINUTE;
const GLOBAL_WINDOW_MS = 60 * MINUTE;
const GLOBAL_MAX_FAILURES = 30;
const MAX_KEYS = 5000;

/** Async so a shared store (Redis) can replace the in-memory default. */
export interface RateLimiter {
  /** False while the client is locked out or all attempts are paused. */
  check(key: string): Promise<boolean>;
  /**
   * Atomically checks and counts an attempt as a failure, so concurrent
   * attempts cannot all pass the check before any failure is recorded.
   * Returns false (and counts nothing) while locked out or paused.
   */
  reserve(key: string): Promise<boolean>;
  /** Forgets the client's failures, including the one `reserve` counted. */
  succeed(key: string): Promise<void>;
}

interface Entry {
  failures: number[];
  lockedUntil: number;
  strikes: number;
}

/**
 * 5 failures in 15 minutes lock a client for 15 minutes, doubling for each
 * repeat lockout (up to 24 h). 30 failures in an hour pause everyone.
 * shortcut: per-instance memory, serverless instances do not share it; add an
 * Upstash adapter behind this interface when that matters.
 */
export function createMemoryLimiter(now: () => number = Date.now): RateLimiter {
  const entries = new Map<string, Entry>();
  let global: number[] = [];

  function prune(time: number) {
    global = global.filter((at) => time - at < GLOBAL_WINDOW_MS);
    if (entries.size <= MAX_KEYS) return;
    for (const [key, entry] of entries) {
      if (entry.lockedUntil <= time && entry.failures.length === 0) {
        entries.delete(key);
      }
    }
    if (entries.size > MAX_KEYS) entries.clear();
  }

  function allowed(key: string, time: number) {
    prune(time);
    if (global.length >= GLOBAL_MAX_FAILURES) return false;
    return (entries.get(key)?.lockedUntil ?? 0) <= time;
  }

  function record(key: string, time: number) {
    global.push(time);
    const entry = entries.get(key) ?? {
      failures: [],
      lockedUntil: 0,
      strikes: 0,
    };
    entry.failures = entry.failures.filter((at) => time - at < WINDOW_MS);
    entry.failures.push(time);
    if (entry.failures.length >= MAX_FAILURES) {
      entry.failures = [];
      entry.lockedUntil =
        time + Math.min(LOCKOUT_MS * 2 ** entry.strikes, MAX_LOCKOUT_MS);
      entry.strikes += 1;
    }
    entries.set(key, entry);
  }

  return {
    async check(key) {
      return allowed(key, now());
    },

    // No await between the check and the record: one tick, no interleaving.
    async reserve(key) {
      const time = now();
      if (!allowed(key, time)) return false;
      record(key, time);
      return true;
    },

    async succeed(key) {
      if (entries.delete(key)) global.pop();
    },
  };
}
