'use server';

import { headers } from 'next/headers';
import { createHmac } from 'node:crypto';

import { createAuthenticator } from './authenticate';
import { getAdminConfig } from './config';
import { verifyPassword } from './password';
import { createMemoryLimiter, type RateLimiter } from './rate-limit';
import { ADMIN_BASE, endSession, getSession, requireAdmin, startSession } from './session';

// One limiter per process, even if the bundler instantiates this module twice.
const store = globalThis as { __jmAuthLimiter?: RateLimiter };
const limiter = (store.__jmAuthLimiter ??= createMemoryLimiter());

async function clientKey() {
  const list = await headers();
  const ip =
    list.get('x-forwarded-for')?.split(',')[0]?.trim() ?? list.get('x-real-ip') ?? 'unknown';
  const config = getAdminConfig();
  const salt = config.enabled ? config.secret : 'disabled';

  return createHmac('sha256', salt).update(ip).digest('hex').slice(0, 24);
}

const authenticator = createAuthenticator({
  limiter,
  clientKey,
  get verify() {
    const config = getAdminConfig();

    return config.enabled
      ? (password: string) => verifyPassword(password, config, config.secret)
      : null;
  },
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => performance.now(),
  random: Math.random,
  log: (event, client) => console.info(JSON.stringify({ type: event, client: client.slice(0, 8) })),
});

export type SessionStatus = { base: string; expiresAt: number; isAdmin: true } | { isAdmin: false };

export async function authenticate(
  password: string,
): Promise<{ expiresAt: number; ok: true; redirectTo: string } | { ok: false }> {
  const result = await authenticator(password);

  if (!result.ok) return { ok: false };

  const exp = await startSession();

  return { ok: true, redirectTo: ADMIN_BASE, expiresAt: exp * 1000 };
}

export async function getSessionStatus(): Promise<SessionStatus> {
  const session = await getSession();

  return session
    ? { isAdmin: true, expiresAt: session.exp * 1000, base: ADMIN_BASE }
    : { isAdmin: false };
}

export async function logout() {
  await endSession();
}

/**
 * The "Stay signed in" button; the only way to renew without navigating.
 */
export async function renewSession(): Promise<SessionStatus> {
  const session = await requireAdmin();
  const exp = await startSession(session.start);

  return { isAdmin: true, expiresAt: exp * 1000, base: ADMIN_BASE };
}
