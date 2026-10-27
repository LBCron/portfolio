import type { RateLimiter } from './rate-limit';

export const MIN_DELAY_MS = 800;
export const JITTER_MS = 200;
export const MAX_PASSWORD_LENGTH = 1024;

export type AuthResult = { ok: true } | { ok: false };

export interface AuthenticatorDeps {
  limiter: RateLimiter;
  /** Stable, non-reversible id of the calling client. */
  clientKey(): Promise<string>;
  /** Null when the admin is disabled. */
  verify: ((password: string) => Promise<boolean>) | null;
  sleep(ms: number): Promise<void>;
  now(): number;
  random(): number;
  log(
    event: 'auth.fail' | 'auth.success' | 'auth.locked',
    client: string,
  ): void;
}

/**
 * Wrong password, lockout, pause and a disabled admin all return the same
 * `{ ok: false }` after the same minimum delay; success waits as long.
 */
export function createAuthenticator(deps: AuthenticatorDeps) {
  return async function authenticate(password: unknown): Promise<AuthResult> {
    const started = deps.now();
    const client = await deps.clientKey();
    let ok = false;

    if (await deps.limiter.check(client)) {
      if (
        deps.verify &&
        typeof password === 'string' &&
        password.length <= MAX_PASSWORD_LENGTH
      ) {
        ok = await deps.verify(password);
      }
      if (ok) {
        await deps.limiter.succeed(client);
        deps.log('auth.success', client);
      } else {
        await deps.limiter.fail(client);
        deps.log('auth.fail', client);
      }
    } else {
      deps.log('auth.locked', client);
    }

    const target = MIN_DELAY_MS + deps.random() * JITTER_MS;
    await deps.sleep(Math.max(0, target - (deps.now() - started)));
    return ok ? { ok: true } : { ok: false };
  };
}
