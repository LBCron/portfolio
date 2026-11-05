import { type RateLimiter } from './rate-limit';

export const MIN_DELAY_MS = 800;
export const JITTER_MS = 200;
export const MAX_PASSWORD_LENGTH = 1024;

export type AuthResult = { ok: false } | { ok: true };

export interface AuthenticatorDeps {
  /**
   * Stable, non-reversible id of the calling client.
   */
  clientKey(): Promise<string>;
  limiter: RateLimiter;
  log(event: 'auth.fail' | 'auth.locked' | 'auth.success', client: string): void;
  now(): number;
  random(): number;
  sleep(ms: number): Promise<void>;
  /**
   * Null when the admin is disabled.
   */
  verify: ((password: string) => Promise<boolean>) | null;
}

/**
 * Wrong password, lockout, pause and a disabled admin all return the same `{
 * ok: false }` after the same minimum delay; success waits as long.
 */
export function createAuthenticator(deps: AuthenticatorDeps) {
  return async function authenticate(password: unknown): Promise<AuthResult> {
    const started = deps.now();
    const client = await deps.clientKey();
    let ok = false;

    // The attempt is counted before the slow verify, so a burst cannot slip through.
    if (await deps.limiter.reserve(client)) {
      if (deps.verify && typeof password === 'string' && password.length <= MAX_PASSWORD_LENGTH) {
        ok = await deps.verify(password);
      }

      if (ok) {
        await deps.limiter.succeed(client);
        deps.log('auth.success', client);
      } else {
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
