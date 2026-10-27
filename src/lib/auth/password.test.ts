import { describe, expect, it } from 'vitest';

import { hashPassword, parseHash, verifyPassword } from './password';

const secret = 's'.repeat(32);

describe('verifyPassword', () => {
  it('checks a plaintext password', async () => {
    const expected = { plain: 'correct horse battery' };
    expect(
      await verifyPassword('correct horse battery', expected, secret),
    ).toBe(true);
    expect(await verifyPassword('correct horse', expected, secret)).toBe(false);
    expect(await verifyPassword('', expected, secret)).toBe(false);
  });

  it('checks a scrypt hash, which wins over the plaintext', async () => {
    const hash = await hashPassword('from the hash');
    expect(hash).toMatch(/^scrypt:\d+:\d+:\d+:/);
    const expected = { hash, plain: 'ignored' };
    expect(await verifyPassword('from the hash', expected, secret)).toBe(true);
    expect(await verifyPassword('ignored', expected, secret)).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('fails closed on a broken hash or no password', async () => {
    expect(parseHash('nonsense')).toBeNull();
    expect(await verifyPassword('x', { hash: 'nonsense' }, secret)).toBe(false);
    expect(await verifyPassword('x', {}, secret)).toBe(false);
  });
});
