import { jwtVerify, SignJWT } from 'jose';

/**
 * No `server-only`: the proxy verifies sessions too.
 */
export const IDLE_SECONDS = 30 * 60;
export const ABSOLUTE_SECONDS = 8 * 60 * 60;
export const RENEW_AFTER_SECONDS = 60;

export interface Session {
  exp: number;
  iat: number;
  /**
   * When the login happened; caps the absolute lifetime across renewals.
   */
  start: number;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export function isStrongSecret(secret: string | undefined): secret is string {
  return typeof secret === 'string' && secret.length >= 32;
}

const key = (secret: string) => new TextEncoder().encode(secret);

/**
 * HS256 JWT: idle expiry 30 min, never past `start` + 8 h.
 */
export async function signSession(secret: string, start: number, now = nowSeconds()) {
  const exp = Math.min(now + IDLE_SECONDS, start + ABSOLUTE_SECONDS);
  const token = await new SignJWT({ ses: start })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('admin')
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .setJti(crypto.randomUUID())
    .sign(key(secret));

  return { token, exp };
}

export async function verifySession(
  secret: string,
  token: string,
  now = nowSeconds(),
): Promise<null | Session> {
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ['HS256'],
      subject: 'admin',
      currentDate: new Date(now * 1000),
    });
    const { ses, iat, exp } = payload as Record<string, unknown>;

    if (
      typeof ses !== 'number'
      || typeof iat !== 'number'
      || typeof exp !== 'number'
      || ses + ABSOLUTE_SECONDS <= now
    ) {
      return null;
    }

    return { start: ses, iat, exp };
  } catch {
    return null;
  }
}
