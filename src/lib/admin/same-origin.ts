import { type NextRequest } from 'next/server';

/**
 * Same-origin browser requests only: Origin and Sec-Fetch-Site must agree.
 */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');

  if (fetchSite && fetchSite !== 'same-origin') return false;

  return origin !== null && new URL(origin).host === request.headers.get('host');
}
