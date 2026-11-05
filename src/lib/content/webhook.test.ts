import { describe, expect, it } from 'vitest';

import { isValidWebhookSignature, signWebhook } from './webhook';

const secret = 'whsec-test';
const body = JSON.stringify({ _type: 'project', slug: 'pay-bridge' });
const now = 1_800_000_000_000;

describe('isValidWebhookSignature', () => {
  it('accepts a fresh, correctly signed body', () => {
    expect(isValidWebhookSignature(body, signWebhook(body, secret, now), secret, now)).toBe(true);
  });

  it('rejects a changed body, another secret and a malformed header', () => {
    const header = signWebhook(body, secret, now);

    expect(isValidWebhookSignature(`${body} `, header, secret, now)).toBe(false);
    expect(isValidWebhookSignature(body, header, 'other', now)).toBe(false);
    expect(isValidWebhookSignature(body, null, secret, now)).toBe(false);
    expect(isValidWebhookSignature(body, 'garbage', secret, now)).toBe(false);
    expect(isValidWebhookSignature(body, header, '', now)).toBe(false);
  });

  it('rejects replays older (or newer) than ten minutes', () => {
    const header = signWebhook(body, secret, now);

    expect(isValidWebhookSignature(body, header, secret, now + 11 * 60_000)).toBe(false);
    expect(isValidWebhookSignature(body, header, secret, now - 11 * 60_000)).toBe(false);
    expect(isValidWebhookSignature(body, header, secret, now + 9 * 60_000)).toBe(true);
  });
});
