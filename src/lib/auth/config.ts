import 'server-only';

import { env, isProduction } from '@/env';

import { parseHash } from './password';
import { isStrongSecret } from './token';

export type AdminConfig =
  | {
      enabled: true;
      secret: string;
      hash?: string | undefined;
      plain?: string | undefined;
    }
  | { enabled: false; problems: string[] };

let cached: AdminConfig | undefined;

export function resolveAdminConfig(source: {
  password?: string | undefined;
  hash?: string | undefined;
  secret?: string | undefined;
  production: boolean;
}): AdminConfig {
  const problems: string[] = [];
  if (!isStrongSecret(source.secret)) {
    problems.push('SESSION_SECRET (missing or shorter than 32 characters)');
  }
  if (source.hash) {
    if (!parseHash(source.hash)) problems.push('ADMIN_PASSWORD_HASH (invalid)');
  } else if (!source.password) {
    problems.push('ADMIN_PASSWORD or ADMIN_PASSWORD_HASH (missing)');
  } else if (source.production && source.password.length < 16) {
    problems.push('ADMIN_PASSWORD (shorter than 16 characters)');
  }
  if (problems.length > 0 || !isStrongSecret(source.secret)) {
    return { enabled: false, problems };
  }
  return {
    enabled: true,
    secret: source.secret,
    hash: source.hash,
    plain: source.password,
  };
}

/** Checked once; problems are reported by name, never by value. */
export function getAdminConfig(): AdminConfig {
  if (!cached) {
    cached = resolveAdminConfig({
      password: env.ADMIN_PASSWORD,
      hash: env.ADMIN_PASSWORD_HASH,
      secret: env.SESSION_SECRET,
      production: isProduction,
    });
    if (
      !cached.enabled &&
      (env.ADMIN_PASSWORD || env.ADMIN_PASSWORD_HASH || env.SESSION_SECRET)
    ) {
      console.warn(`[auth] admin disabled: ${cached.problems.join('; ')}`);
    }
  }
  return cached;
}
