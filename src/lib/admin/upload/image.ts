import sharp from 'sharp';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_SIDE = 4000;

export type ImageKind = 'jpeg' | 'png' | 'webp' | 'avif';

const CONTENT_TYPE: Record<ImageKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
};

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

/** Magic bytes decide the format; extension and declared type are ignored. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpeg';
  if (
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 4) === 'PNG' &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a
  ) {
    return 'png';
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'avif';
  }
  return null;
}

export function normalizeFilename(name: string, ext: string): string {
  const stem = name
    .replace(/\.[a-z0-9]{1,5}$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${stem || 'image'}.${ext}`;
}

export interface ProcessedImage {
  bytes: Buffer;
  contentType: string;
  filename: string;
  width: number;
  height: number;
}

/**
 * Re-encodes every upload: EXIF orientation is applied, all metadata
 * (including GPS) is dropped, the longest side is capped, alpha is kept.
 * sharp discards metadata unless `withMetadata` is called, so none is.
 */
export async function processImage(
  input: Buffer,
  kind: ImageKind,
  filename: string,
): Promise<ProcessedImage> {
  const pipeline = sharp(input, { limitInputPixels: 100_000_000 })
    .rotate()
    .resize({
      width: MAX_SIDE,
      height: MAX_SIDE,
      fit: 'inside',
      withoutEnlargement: true,
    });
  const encoded =
    kind === 'jpeg'
      ? pipeline.jpeg({ quality: 86, mozjpeg: true })
      : kind === 'png'
        ? pipeline.png()
        : kind === 'webp'
          ? pipeline.webp({ quality: 86 })
          : pipeline.avif({ quality: 60 });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
  return {
    bytes: data,
    contentType: CONTENT_TYPE[kind],
    filename: normalizeFilename(filename, kind === 'jpeg' ? 'jpg' : kind),
    width: info.width,
    height: info.height,
  };
}
