import { ImageResponse } from 'next/og';

import { owner, THEME_COLOR } from '@/config/site';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: THEME_COLOR,
        color: '#4cc9f0',
        fontSize: 72,
        fontWeight: 700,
        letterSpacing: '-0.04em',
      }}
    >
      {owner.initials}
    </div>,
    { ...size },
  );
}
