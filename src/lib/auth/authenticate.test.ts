import { describe, expect, it } from 'vitest';

import {
  type AuthenticatorDeps,
  createAuthenticator,
  MIN_DELAY_MS,
} from './authenticate';
import { createMemoryLimiter } from './rate-limit';

function setup(overrides: Partial<AuthenticatorDeps> = {}) {
  let time = 0;
  const sleeps: number[] = [];
  const events: string[] = [];
  const authenticate = createAuthenticator({
    limiter: createMemoryLimiter(() => time),
    clientKey: async () => 'client',
    verify: async (password) => password === 'right',
    sleep: async (ms) => {
      sleeps.push(ms);
      time += ms;
    },
    now: () => time,
    random: () => 0.5,
    log: (event) => events.push(event),
    ...overrides,
  });
  return { authenticate, sleeps, events };
}

describe('authenticate', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const { authenticate, events } = setup();
    expect(await authenticate('wrong')).toEqual({ ok: false });
    expect(await authenticate('right')).toEqual({ ok: true });
    expect(events).toEqual(['auth.fail', 'auth.success']);
  });

  it('waits the same minimum for success, failure and lockout', async () => {
    const { authenticate, sleeps } = setup();
    await authenticate('right');
    await authenticate('wrong');
    for (let i = 0; i < 5; i += 1) await authenticate('wrong');
    await authenticate('right');
    expect(sleeps.every((ms) => ms >= MIN_DELAY_MS)).toBe(true);
    expect(new Set(sleeps).size).toBe(1);
  });

  it('locks out after repeated failures, even for the right password', async () => {
    const { authenticate, events } = setup();
    for (let i = 0; i < 5; i += 1) await authenticate('wrong');
    expect(await authenticate('right')).toEqual({ ok: false });
    expect(events.at(-1)).toBe('auth.locked');
  });

  it('fails generically when the admin is disabled or the input is odd', async () => {
    const disabled = setup({ verify: null });
    expect(await disabled.authenticate('right')).toEqual({ ok: false });
    const { authenticate } = setup();
    expect(await authenticate(undefined)).toEqual({ ok: false });
    expect(await authenticate('x'.repeat(5000))).toEqual({ ok: false });
  });
});
