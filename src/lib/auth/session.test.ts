import { afterEach, describe, expect, it, vi } from 'vitest';

const set = vi.fn();

vi.mock('next/headers', () => ({ cookies: async (): Promise<{ set: typeof set }> => ({ set }) }));
vi.mock('next/navigation', () => ({ notFound: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  set.mockClear();
});

describe('endSession', () => {
  it('expires the __Host- cookie with Secure so https browsers accept it', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');

    const { endSession } = await import('./session');

    await endSession();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '__Host-jm_session',
        value: '',
        secure: true,
        path: '/',
        expires: new Date(0),
      }),
    );
  });
});
