import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isRecordable } from '../../registry';
import { createHarness, flatten } from '../../test-utils';

const actions = vi.hoisted(() => ({
  authenticate: vi.fn(),
  getSessionStatus: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/lib/auth/actions', () => actions);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- inferred type is the clearest description
const loadSecret = () => import('.');
const session = { expiresAt: Date.now() + 600_000, base: '/admin' };

beforeEach(() => {
  actions.authenticate.mockReset();
  actions.getSessionStatus.mockReset();
  actions.logout.mockReset();
});

describe('su', () => {
  it('reads the password, authenticates and moves to the redirect', async () => {
    actions.authenticate.mockResolvedValue({
      ok: true,
      redirectTo: '/admin',
      expiresAt: session.expiresAt,
    });

    const readSecret = vi.fn().mockResolvedValue('hunter2');
    const harness = await createHarness('en', { loadSecret, readSecret });
    const output = flatten(await harness.run('su julio'));

    expect(readSecret).toHaveBeenCalledWith('Password:', expect.anything());
    expect(actions.authenticate).toHaveBeenCalledWith('hunter2');
    expect(output).toBe('Authenticated.');
    expect(harness.calls).toEqual(['session:on', 'goto:/admin']);
  });

  it('fails the same way for a wrong password, any target and no target', async () => {
    actions.authenticate.mockResolvedValue({ ok: false });

    const harness = await createHarness('en', {
      loadSecret,
      readSecret: async () => 'nope',
    });
    for (const line of ['su julio', 'su root', 'su']) {
      expect(flatten(await harness.run(line))).toBe('su: Authentication failure');
    }
    expect(harness.calls).toEqual([]);
  });

  it('stops quietly when the prompt is cancelled', async () => {
    const harness = await createHarness('en', {
      loadSecret,
      readSecret: async () => null,
    });

    expect(await harness.run('su julio')).toEqual([]);
    expect(actions.authenticate).not.toHaveBeenCalled();
  });
});

describe('admin and logout', () => {
  it('are byte-identical to unknown commands without a session', async () => {
    const harness = await createHarness('en', { loadSecret });
    for (const name of ['admin', 'logout']) {
      const secret = flatten(await harness.run(name));
      const unknown = flatten(await harness.run('qwzxv')).replace('qwzxv', name);

      expect(secret).toBe(unknown);
    }
    expect(actions.getSessionStatus).not.toHaveBeenCalled();
    expect(actions.logout).not.toHaveBeenCalled();
  });

  it('admin lists the areas and opens one', async () => {
    actions.getSessionStatus.mockResolvedValue({ isAdmin: true, ...session });

    const harness = await createHarness('en', { loadSecret, session });
    const listed = await harness.run('admin');

    expect(listed[1]).toMatchObject({ type: 'command' });
    expect(JSON.stringify(listed)).toContain('"command":"admin projects"');
    await harness.run('admin projects');
    expect(harness.calls).toContain('goto:/admin/projects');
    expect(flatten(await harness.run('admin nope'))).toContain('unknown area');
  });

  it('admin ends the session when the server says it is over', async () => {
    actions.getSessionStatus.mockResolvedValue({ isAdmin: false });

    const harness = await createHarness('en', { loadSecret, session });

    expect(flatten(await harness.run('admin'))).toBe('session expired');
    expect(harness.calls).toEqual(['session:off']);
  });

  it('logout clears the session', async () => {
    const harness = await createHarness('en', { loadSecret, session });

    expect(flatten(await harness.run('logout'))).toBe('Signed out.');
    expect(actions.logout).toHaveBeenCalled();
    expect(harness.calls).toEqual(['session:off']);
  });
});

describe('expiry', () => {
  it('prints "session expired" on the next command and reverts', async () => {
    actions.getSessionStatus.mockResolvedValue({ isAdmin: false });

    const old = { expiresAt: Date.now() - 1000, base: '/admin' };
    const harness = await createHarness('en', { loadSecret, session: old });

    expect(flatten(await harness.run('pwd'))).toBe('session expired\n~');
    expect(harness.calls).toEqual(['session:off']);
  });

  it('keeps the session when the server renewed it elsewhere', async () => {
    actions.getSessionStatus.mockResolvedValue({ isAdmin: true, ...session });

    const old = { expiresAt: Date.now() - 1000, base: '/admin' };
    const harness = await createHarness('en', { loadSecret, session: old });

    expect(flatten(await harness.run('pwd'))).toBe('~');
    expect(harness.calls).toEqual(['session:on']);
  });
});

describe('invisibility', () => {
  const secretNames = ['su', 'admin', 'logout'];

  it('never appear in help, suggestions or history', async () => {
    const harness = await createHarness('en', { loadSecret, session });
    const help = flatten(await harness.run('help'));
    for (const name of secretNames) {
      expect(help).not.toMatch(new RegExp(`\\b${name}\\b`));
      expect(isRecordable(harness.deps.registry, `${name} julio`)).toBe(false);
    }
    expect(flatten(await harness.run('suu'))).not.toContain('Did you mean su');
    expect(flatten(await harness.run('logou'))).not.toContain('logout');
  });

  it('do not answer --help', async () => {
    actions.authenticate.mockResolvedValue({ ok: false });

    const harness = await createHarness('en', {
      loadSecret,
      readSecret: async () => '',
    });

    expect(flatten(await harness.run('su --help'))).toBe('su: Authentication failure');
  });
});
