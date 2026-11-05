import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { MAX_SIDE, normalizeFilename, processImage, sniffImage } from './image';
import { checkPdf } from './pdf';
import { sanitizeSvg } from './svg';

const raster = (
  width: number,
  height: number,
  format: 'avif' | 'jpeg' | 'png' | 'webp',
): Promise<Buffer<ArrayBuffer>> =>
  sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 200, g: 30, b: 30, alpha: 0.5 },
    },
  })
    [format]()
    .toBuffer();

describe('sniffImage', () => {
  it('recognizes the four formats by magic bytes', async () => {
    for (const format of ['jpeg', 'png', 'webp', 'avif'] as const) {
      expect(sniffImage(await raster(8, 8, format))).toBe(format);
    }
  });

  it('rejects everything else, whatever the name says', () => {
    expect(
      sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    ).toBeNull();
    expect(sniffImage(new TextEncoder().encode('GIF89a......'))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe('processImage', () => {
  it('caps the longest side and keeps the format and alpha', async () => {
    const big = await raster(5000, 1000, 'png');
    const out = await processImage(big, 'png', 'Wide Shot.PNG');

    expect(out.width).toBe(MAX_SIDE);
    expect(out.height).toBe(800);
    expect(out.filename).toBe('wide-shot.png');
    expect((await sharp(out.bytes).metadata()).hasAlpha).toBe(true);
  });

  it('never enlarges small images', async () => {
    const out = await processImage(await raster(40, 30, 'webp'), 'webp', 'a.webp');

    expect([out.width, out.height]).toEqual([40, 30]);
  });

  it('applies the EXIF orientation and drops all metadata, GPS included', async () => {
    const tagged = await sharp({
      create: { width: 60, height: 20, channels: 3, background: '#09f' },
    })
      .jpeg()
      .withExif({
        IFD0: { Copyright: 'secret-owner' },
        IFD3: { GPSLatitudeRef: 'N' },
      })
      .withMetadata({ orientation: 6 })
      .toBuffer();

    expect((await sharp(tagged).metadata()).orientation).toBe(6);

    const out = await processImage(tagged, 'jpeg', 'photo.jpeg');
    const meta = await sharp(out.bytes).metadata();

    expect(meta.orientation).toBeUndefined();
    expect(meta.exif).toBeUndefined();
    expect([out.width, out.height]).toEqual([20, 60]);
    expect(out.bytes.includes(Buffer.from('secret-owner'))).toBe(false);
    expect(out.filename).toBe('photo.jpg');
  });

  it('refuses corrupt data', async () => {
    await expect(
      processImage(Buffer.from('\xff\xd8\xff nonsense'), 'jpeg', 'x.jpg'),
    ).rejects.toThrow();
  });
});

describe('normalizeFilename', () => {
  it('slugifies and keeps the real extension', () => {
    expect(normalizeFilename('Foto Çomum (1).JPG', 'jpg')).toBe('foto-comum-1.jpg');
    expect(normalizeFilename('../../etc/passwd', 'png')).toBe('etc-passwd.png');
    expect(normalizeFilename('日本語.png', 'png')).toBe('image.png');
  });
});

describe('checkPdf', () => {
  const pdf = (body: string): Uint8Array<ArrayBuffer> =>
    new TextEncoder().encode(`%PDF-1.7\n${body}\n%%EOF`);

  it('accepts a plain PDF', () => {
    expect(checkPdf(pdf('1 0 obj << /Type /Catalog >> endobj'))).toEqual({
      ok: true,
    });
  });

  it('requires the header', () => {
    expect(checkPdf(new TextEncoder().encode('hello'))).toMatchObject({
      ok: false,
    });
    expect(checkPdf(new TextEncoder().encode(' %PDF-1.4'))).toMatchObject({
      ok: false,
    });
  });

  it.each(['/JavaScript', '/JS (app.alert(1))', '/Launch /F (cmd)'])('rejects %s', (action) => {
    expect(checkPdf(pdf(`<< /S ${action} >>`))).toMatchObject({ ok: false });
  });

  it('does not trip on look-alike names', () => {
    expect(checkPdf(pdf('<< /JSON 1 /Launcher 2 >>'))).toEqual({ ok: true });
  });
});

describe('sanitizeSvg', () => {
  const svg = (inner: string, attrs = 'viewBox="0 0 24 24"'): string =>
    `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;

  it('keeps geometry as data', () => {
    const result = sanitizeSvg(
      svg(
        '<path d="M0 0h10v10H0Z"/><circle cx="12" cy="12" r="4"/><rect x="1" y="1" width="2" height="2"/>',
      ),
    );

    expect(result).toMatchObject({ ok: true, svg: { viewBox: '0 0 24 24' } });

    if (result.ok) expect(result.svg.paths).toHaveLength(3);
  });

  it('falls back to width and height, and unwraps groups', () => {
    const result = sanitizeSvg(svg('<g><path d="M0 0h4v4H0Z"/></g>', 'width="32" height="16"'));

    expect(result).toMatchObject({ ok: true, svg: { viewBox: '0 0 32 16' } });
  });

  it('drops scripts, styles, use, foreignObject, images and handlers with their content', () => {
    const result = sanitizeSvg(
      svg(
        '<script>alert(1)</script><style>*{fill:red}</style><use href="x.svg#a"/>'
          + '<foreignObject><div onclick="x()">hi</div></foreignObject><image href="https://evil/x.png"/>'
          + '<path d="M0 0h4v4H0Z" onclick="alert(1)" id="b"/>',
      ),
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/script|alert|onclick|evil|href|foreign/i);
  });

  it('skips nested dropped elements correctly', () => {
    const result = sanitizeSvg(
      svg('<defs><g><path d="M9 9h1v1H9Z"/></g></defs><path d="M0 0h4v4H0Z"/>'),
    );

    expect(result).toMatchObject({ ok: true });

    if (result.ok) expect(result.svg.paths).toEqual(['M0 0h4v4H0Z']);
  });

  it('refuses what it cannot draw faithfully', () => {
    expect(sanitizeSvg(svg('<path d="M0 0L5 5" stroke="#000"/>'))).toMatchObject({ ok: false });
    expect(sanitizeSvg(svg('<path d="M0 0h4v4H0Z" transform="rotate(5)"/>'))).toMatchObject({
      ok: false,
    });
    expect(sanitizeSvg(svg('<line x1="0" y1="0" x2="5" y2="5"/>'))).toMatchObject({ ok: false });
    expect(sanitizeSvg(svg('<g fill="red"><path d="M0 0h4v4H0Z"/></g>'))).toMatchObject({
      ok: false,
    });
    for (const attr of [
      'fill-rule="evenodd"',
      'clip-rule="evenodd"',
      'style="fill:none;stroke:#000"',
      'class="a"',
      'display="none"',
    ])
      expect(sanitizeSvg(svg(`<path d="M0 0h4v4H0Z" ${attr}/>`))).toMatchObject({ ok: false });
  });

  it('refuses entities, doctype, oversized files and missing pieces', () => {
    expect(
      sanitizeSvg(`<!DOCTYPE svg [<!ENTITY a "b">]>${svg('<path d="M0 0h1v1H0Z"/>')}`),
    ).toMatchObject({ ok: false });
    expect(sanitizeSvg(svg(`<path d="${'M0 0h1v1H0Z '.repeat(3000)}"/>`))).toMatchObject({
      ok: false,
    });
    expect(sanitizeSvg('<path d="M0 0h1v1H0Z"/>')).toMatchObject({ ok: false });
    expect(sanitizeSvg(svg('<path d="M0 0h1v1H0Z"/>', ''))).toMatchObject({
      ok: false,
    });
    expect(sanitizeSvg(svg(''))).toMatchObject({ ok: false });
  });
});
