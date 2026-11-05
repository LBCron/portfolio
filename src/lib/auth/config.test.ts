import { describe, expect, it } from 'vitest';

import { resolveAdminConfig } from './config';
import { hashPassword } from './password';

const secret = 's'.repeat(32);

describe('resolveAdminConfig', () => {
  it('enables with a strong secret and a password or hash', async () => {
    expect(resolveAdminConfig({ password: 'short', secret, production: false }).enabled).toBe(true);
    expect(
      resolveAdminConfig({
        hash: await hashPassword('x'),
        secret,
        production: true,
      }).enabled,
    ).toBe(true);
  });

  it('requires 16 characters in production and names problems without values', () => {
    const config = resolveAdminConfig({
      password: 'short-password',
      secret: 'weak',
      production: true,
    });

    expect(config).toMatchObject({ enabled: false });

    const problems = (config as { problems: string[] }).problems.join(' ');

    expect(problems).toContain('SESSION_SECRET');
    expect(problems).toContain('ADMIN_PASSWORD');
    expect(problems).not.toContain('short-password');
  });

  it('is disabled with no password or an invalid hash', () => {
    expect(resolveAdminConfig({ secret, production: false }).enabled).toBe(false);
    expect(resolveAdminConfig({ hash: 'junk', secret, production: false }).enabled).toBe(false);
  });
});
