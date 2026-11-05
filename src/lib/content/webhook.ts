import { createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'sanity-webhook-signature';
const TOLERANCE_MS = 10 * 60 * 1000;
const HEADER = /^t=(\d+)[, ]+v1=([\w-]+)$/;

/**
 * Sanity signs `<timestamp ms>.<raw body>` with HMAC-SHA256 (base64url) and
 * sends `t=<timestamp>,v1=<signature>`. Old timestamps are refused (replay).
 */
export function isValidWebhookSignature(
  body: string,
  header: null | string,
  secret: string,
  now: number = Date.now(),
): boolean {
  const match = header ? HEADER.exec(header.trim()) : null;

  if (!match || !body || !secret) return false;

  const timestamp = Number(match[1]);

  if (Math.abs(now - timestamp) > TOLERANCE_MS) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('base64url');
  const given = match[2] as string;

  return (
    expected.length === given.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given))
  );
}

export function signWebhook(body: string, secret: string, timestamp = Date.now()) {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('base64url');

  return `t=${timestamp},v1=${signature}`;
}
