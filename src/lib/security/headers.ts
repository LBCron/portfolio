/**
 * Security headers (SPEC §15, D4, D56). Shared by `next.config.ts` (every
 * response) and `src/proxy.ts` (the admin's nonce policy), so this module must
 * stay dependency-free and must not import `server-only`.
 */

export interface SecurityOptions {
  /**
   * `next dev` needs `'unsafe-eval'` for React's error overlay.
   */
  dev: boolean;
  /**
   * HSTS and `upgrade-insecure-requests` only make sense on https; on the
   * plain-http e2e server WebKit would upgrade localhost requests and fail.
   */
  https: boolean;
}

export function isHttpsSite(siteUrl: string | undefined) {
  return (siteUrl ?? '').startsWith('https:');
}

function serialize(directives: Record<string, string[]>) {
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');
}

function baseDirectives({ https }: SecurityOptions): Record<string, string[]> {
  return {
    'default-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(https ? { 'upgrade-insecure-requests': [] } : {}),
  };
}

/**
 * Public pages are prerendered with ISR, so a per-request nonce is impossible
 * and the inline RSC flight scripts change on every revalidation (no build-time
 * hashes). Scripts therefore keep `'unsafe-inline'`, limited to `'self'` with
 * no third-party origin to load from or exfiltrate to (D4).
 */
export function publicCsp(options: SecurityOptions) {
  const unsafeEval = options.dev ? ["'unsafe-eval'"] : [];

  return serialize({
    ...baseDirectives(options),
    'script-src': ["'self'", "'unsafe-inline'", ...unsafeEval],
    'style-src': ["'self'", ...(options.dev ? ["'unsafe-inline'"] : [])],
    'style-src-attr': ["'unsafe-inline'"],
  });
}

/**
 * The admin is dynamic, so it gets a per-request nonce instead.
 */
export function adminCsp(nonce: string, options: SecurityOptions) {
  const unsafeEval = options.dev ? ["'unsafe-eval'"] : [];

  return serialize({
    ...baseDirectives(options),
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...unsafeEval],
    'style-src': ["'self'", ...(options.dev ? ["'unsafe-inline'"] : [`'nonce-${nonce}'`])],
    'style-src-attr': ["'unsafe-inline'"],
  });
}

/**
 * Features the site never uses; each is denied to every origin.
 */
const DENIED_FEATURES = [
  'accelerometer',
  'autoplay',
  'bluetooth',
  'camera',
  'display-capture',
  'encrypted-media',
  'geolocation',
  'gyroscope',
  'hid',
  'idle-detection',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'serial',
  'usb',
  'xr-spatial-tracking',
];

export const PERMISSIONS_POLICY = DENIED_FEATURES.map((f) => `${f}=()`).join(', ');

export const HSTS = 'max-age=63072000; includeSubDomains';

/**
 * Headers for every response; the admin overrides CSP and the referrer.
 */
export function securityHeaders(options: SecurityOptions) {
  return [
    { key: 'Content-Security-Policy', value: publicCsp(options) },
    ...(options.https ? [{ key: 'Strict-Transport-Security', value: HSTS }] : []),
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  ];
}
