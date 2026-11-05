/**
 * `__Host-` needs Secure, and Secure only works on https, so both follow the
 * configured site URL: https in production, plain names on http (dev, e2e).
 */
const secure = (process.env['NEXT_PUBLIC_SITE_URL'] ?? '').startsWith('https:');

export const SESSION_COOKIE = secure ? '__Host-jm_session' : 'jm_session';

export function sessionCookie(
  token: string,
  exp: number,
): {
  expires: Date;
  httpOnly: boolean;
  name: string;
  path: string;
  sameSite: 'strict';
  secure: boolean;
  value: string;
} {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure,
    sameSite: 'strict' as const,
    path: '/',
    expires: new Date(exp * 1000),
  };
}
