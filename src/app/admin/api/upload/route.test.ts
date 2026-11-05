import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { MAX_IMAGE_BYTES } from '@/lib/admin/upload/image';
import { MAX_PDF_BYTES } from '@/lib/admin/upload/pdf';

import { POST } from './route';

vi.mock('@/lib/auth/session', () => ({
  getSession: async () => ({ start: 1 }),
}));

const upload = (headers: Record<string, string>) =>
  new NextRequest('http://localhost/admin/api/upload', {
    method: 'POST',
    headers: { origin: 'http://localhost', host: 'localhost', ...headers },
    body: 'x',
  });

describe('POST /admin/api/upload', () => {
  it('stays under the 4.5 MB request cap of Vercel functions', () => {
    expect(Math.max(MAX_IMAGE_BYTES, MAX_PDF_BYTES)).toBeLessThan(4.5 * 1024 * 1024);
  });

  it('refuses a body without a Content-Length instead of counting it as 0', async () => {
    const request = upload({});

    request.headers.delete('content-length');
    expect((await POST(request)).status).toBe(411);
  });

  it('refuses an oversized body before parsing it', async () => {
    const response = await POST(upload({ 'content-length': String(MAX_PDF_BYTES + 1024 * 1024) }));

    expect(response.status).toBe(413);
  });
});
