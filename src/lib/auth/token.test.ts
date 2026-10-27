import { describe, expect, it } from 'vitest';

import {
  ABSOLUTE_SECONDS,
  IDLE_SECONDS,
  isStrongSecret,
  signSession,
  verifySession,
} from './token';

const secret = 'x'.repeat(32);
const now = 1_800_000_000;

describe('session token', () => {
  it('round-trips and expires after 30 idle minutes', async () => {
    const { token, exp } = await signSession(secret, now, now);
    expect(exp).toBe(now + IDLE_SECONDS);
    expect(await verifySession(secret, token, now + 60)).toMatchObject({
      start: now,
      iat: now,
      exp,
    });
    expect(await verifySession(secret, token, exp + 1)).toBeNull();
  });

  it('never outlives 8 hours, however often it is renewed', async () => {
    const late = now + ABSOLUTE_SECONDS - 60;
    const { token, exp } = await signSession(secret, now, late);
    expect(exp).toBe(now + ABSOLUTE_SECONDS);
    expect(await verifySession(secret, token, late)).not.toBeNull();
    expect(await verifySession(secret, token, exp)).toBeNull();
  });

  it('rejects other secrets, tampering and garbage', async () => {
    const { token } = await signSession(secret, now, now);
    expect(await verifySession('y'.repeat(32), token, now)).toBeNull();
    expect(await verifySession(secret, `${token}x`, now)).toBeNull();
    expect(await verifySession(secret, 'not-a-token', now)).toBeNull();
  });

  it('requires a 32-character secret', () => {
    expect(isStrongSecret('x'.repeat(31))).toBe(false);
    expect(isStrongSecret(undefined)).toBe(false);
    expect(isStrongSecret(secret)).toBe(true);
  });
});
