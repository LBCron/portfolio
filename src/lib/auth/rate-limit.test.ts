import { describe, expect, it } from 'vitest';

import { createMemoryLimiter } from './rate-limit';

const MIN = 60_000;

function setup() {
  let time = 1_000_000;
  const limiter = createMemoryLimiter(() => time);

  return {
    limiter,
    advance: (ms: number): number => (time += ms),
    fail: async (key: string, times: number): Promise<void> => {
      for (let i = 0; i < times; i += 1) await limiter.reserve(key);
    },
  };
}

describe('memory limiter', () => {
  it('locks a client out after 5 failures for 15 minutes', async () => {
    const { limiter, advance, fail } = setup();

    await fail('a', 4);
    expect(await limiter.check('a')).toBe(true);
    await fail('a', 1);
    expect(await limiter.check('a')).toBe(false);
    expect(await limiter.check('b')).toBe(true);
    advance(15 * MIN - 1);
    expect(await limiter.check('a')).toBe(false);
    advance(2);
    expect(await limiter.check('a')).toBe(true);
  });

  it('counts concurrent attempts before any of them finishes', async () => {
    const { limiter } = setup();
    const results = await Promise.all(Array.from({ length: 20 }, () => limiter.reserve('a')));

    expect(results.filter(Boolean)).toHaveLength(5);
    expect(await limiter.check('fresh')).toBe(true);
  });

  it('refunds the reserved attempt on success', async () => {
    const { limiter } = setup();
    for (let i = 0; i < 30; i += 1) {
      await limiter.reserve('a');
      await limiter.succeed('a');
    }
    expect(await limiter.check('fresh')).toBe(true);
  });

  it('doubles the lockout for repeat offenders', async () => {
    const { limiter, advance, fail } = setup();

    await fail('a', 5);
    advance(15 * MIN + 1);
    await fail('a', 5);
    advance(15 * MIN + 1);
    expect(await limiter.check('a')).toBe(false);
    advance(15 * MIN);
    expect(await limiter.check('a')).toBe(true);
  });

  it('forgets failures older than 15 minutes and clears on success', async () => {
    const { limiter, advance, fail } = setup();

    await fail('a', 4);
    advance(16 * MIN);
    await fail('a', 4);
    expect(await limiter.check('a')).toBe(true);
    await limiter.succeed('a');
    await fail('a', 4);
    expect(await limiter.check('a')).toBe(true);
  });

  it('pauses everyone after 30 failures in an hour', async () => {
    const { limiter, advance, fail } = setup();
    for (let client = 0; client < 10; client += 1) await fail(`c${client}`, 3);
    expect(await limiter.check('fresh')).toBe(false);
    advance(61 * MIN);
    expect(await limiter.check('fresh')).toBe(true);
  });
});
