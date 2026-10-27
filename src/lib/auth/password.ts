import 'server-only';

import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: 256 * n * r },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

/** `scrypt:N:r:p:salt:hash` (no `$`, so env files do not expand it) (base64). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, N, R, P);
  return `scrypt:${N}:${R}:${P}:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function parseHash(encoded: string) {
  const [scheme, n, r, p, salt, hash] = encoded.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return null;
  const params = [n, r, p].map(Number);
  if (params.some((value) => !Number.isInteger(value) || value < 1)) {
    return null;
  }
  return {
    n: params[0] as number,
    r: params[1] as number,
    p: params[2] as number,
    salt: Buffer.from(salt, 'base64'),
    hash: Buffer.from(hash, 'base64'),
  };
}

/**
 * A hash wins over the plaintext password. Plaintext candidates are HMACed
 * with the session secret first, which equalizes length before the
 * constant-time compare.
 */
export async function verifyPassword(
  candidate: string,
  expected: { hash?: string | undefined; plain?: string | undefined },
  secret: string,
): Promise<boolean> {
  if (expected.hash) {
    const parsed = parseHash(expected.hash);
    if (!parsed) return false;
    const derived = await derive(
      candidate,
      parsed.salt,
      parsed.n,
      parsed.r,
      parsed.p,
    );
    return (
      derived.length === parsed.hash.length &&
      timingSafeEqual(derived, parsed.hash)
    );
  }
  if (!expected.plain) return false;
  const mac = (value: string) =>
    createHmac('sha256', secret).update(value).digest();
  return timingSafeEqual(mac(candidate), mac(expected.plain));
}
