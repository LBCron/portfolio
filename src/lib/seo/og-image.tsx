import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { owner, THEME_COLOR } from '@/config/site';

import { absoluteUrl } from './urls';

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

const geistSemiBold = await readFile(
  join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.ttf'),
);
const geistRegular = await readFile(
  join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'),
);

async function asDataUrl(url?: string) {
  if (!url) return undefined;

  try {
    if (url.startsWith('/')) {
      const file = await readFile(join(process.cwd(), 'public', url));

      return `data:image/webp;base64,${file.toString('base64')}`;
    }

    const response = await fetch(absoluteUrl(url));

    if (!response.ok) return undefined;

    const buffer = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get('content-type') ?? 'image/jpeg';

    return `data:${type};base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export interface OgImageInput {
  alt: string;
  photoUrl?: string;
  subtitle: string;
  title: string;
}

export async function renderOgImage({ title, subtitle, photoUrl }: OgImageInput) {
  const photo = await asDataUrl(photoUrl);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: THEME_COLOR,
        color: '#e8eaf0',
        padding: '72px',
        fontFamily: 'Geist',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgb(139 124 255 / 0.22), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgb(76 201 240 / 0.16), transparent)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: '2px solid #8b7cff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4cc9f0',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {owner.initials}
        </div>
        <span style={{ fontSize: 28, color: '#a3a9b8' }}>{owner.name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              fontSize: title.length > 48 ? 52 : 64,
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 28,
              color: '#a3a9b8',
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        </div>
        {photo ? (
          // Satori (next/og) only understands <img>, not next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={220}
            height={220}
            alt=""
            style={{
              width: 220,
              height: 220,
              borderRadius: 28,
              objectFit: 'cover',
              border: '2px solid rgb(255 255 255 / 0.12)',
            }}
          />
        ) : null}
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: 'Geist',
          data: geistSemiBold,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Geist',
          data: geistRegular,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );
}
