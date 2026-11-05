import 'server-only';

import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getAdminConfig } from './config';
import { SESSION_COOKIE, sessionCookie } from './cookie';
import { type Session, signSession, verifySession } from './token';

export const ADMIN_BASE = '/admin';

export async function getSession(): Promise<null | Session> {
  // Read cookies first so the admin is always dynamic, even at build time
  // when the config is empty and nothing else would opt it out of prerender.
  const jar = await cookies();
  const config = getAdminConfig();

  if (!config.enabled) return null;

  const token = jar.get(SESSION_COOKIE)?.value;

  return token ? verifySession(config.secret, token) : null;
}

/**
 * Every admin page, route handler and action calls this; failure is a 404.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();

  if (!session) notFound();

  return session;
}

/**
 * `start` keeps the 8-hour cap across renewals; omit it for a new login.
 */
export async function startSession(start?: number): Promise<number> {
  const config = getAdminConfig();

  if (!config.enabled) throw new Error('admin disabled');

  const now = Math.floor(Date.now() / 1000);
  const { token, exp } = await signSession(config.secret, start ?? now, now);

  (await cookies()).set(sessionCookie(token, exp));

  return exp;
}

export async function endSession(): Promise<void> {
  // `delete()` omits `Secure`, which browsers reject for `__Host-` cookies.
  (await cookies()).set(sessionCookie('', 0));
}
