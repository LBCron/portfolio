import { renderOgImage } from './og-image';

describe('renderOgImage', () => {
  it('returns a PNG', { timeout: 15_000 }, async () => {
    const response = await renderOgImage({
      title: 'Orbit Dashboard',
      subtitle: 'A fictional analytics console',
      alt: 'Orbit Dashboard',
    });

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('content-type')).toMatch(/image\/png/);

    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
    expect(bytes.byteLength).toBeGreaterThan(8_000);
  });
});
