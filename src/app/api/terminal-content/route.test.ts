import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('GET /api/terminal-content', () => {
  it('is never cached by a CDN, so hidden items cannot linger', async () => {
    const response = await GET(new Request('http://localhost/api/terminal-content?locale=en'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('404s on an unknown locale', async () => {
    const response = await GET(new Request('http://localhost/api/terminal-content?locale=xx'));

    expect(response.status).toBe(404);
  });
});
