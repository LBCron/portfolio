import { adminCsp, isHttpsSite, PERMISSIONS_POLICY, publicCsp, securityHeaders } from './headers';

const prod = { dev: false, https: true };
const directive = (csp: string, name: string): string | undefined =>
  csp.split('; ').find((part) => part === name || part.startsWith(`${name} `));

describe('publicCsp', () => {
  it('is the strict static policy in production', () => {
    const csp = publicCsp(prod);

    expect(directive(csp, 'script-src')).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive(csp, 'style-src')).toBe("style-src 'self'");
    expect(directive(csp, 'object-src')).toBe("object-src 'none'");
    expect(directive(csp, 'base-uri')).toBe("base-uri 'none'");
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(directive(csp, 'upgrade-insecure-requests')).toBeDefined();
    expect(csp).not.toContain('unsafe-eval');
  });

  it('allows eval only in development and skips the upgrade on http', () => {
    const csp = publicCsp({ dev: true, https: false });

    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(csp, 'upgrade-insecure-requests')).toBeUndefined();
  });
});

describe('adminCsp', () => {
  it('uses the nonce with strict-dynamic and no inline allowance', () => {
    const csp = adminCsp('abc', prod);

    expect(directive(csp, 'script-src')).toBe("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(directive(csp, 'style-src')).toBe("style-src 'self' 'nonce-abc'");
  });
});

describe('securityHeaders', () => {
  it('sends HSTS without preload on https only', () => {
    const hsts = (https: boolean): string | undefined =>
      securityHeaders({ dev: false, https }).find((h) => h.key === 'Strict-Transport-Security')
        ?.value;

    expect(hsts(true)).toBe('max-age=63072000; includeSubDomains');
    expect(hsts(false)).toBeUndefined();
  });

  it('denies the unused powerful features', () => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'usb']) {
      expect(PERMISSIONS_POLICY).toContain(`${feature}=()`);
    }
  });

  it('detects https sites', () => {
    expect(isHttpsSite('https://juliolmuller.com')).toBe(true);
    expect(isHttpsSite('http://localhost:3100')).toBe(false);
    expect(isHttpsSite(undefined)).toBe(false);
  });
});
