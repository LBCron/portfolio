import { ImageResponse } from 'next/og';

import { owner, THEME_COLOR } from '@/config/site';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon(): ImageResponse {
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
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {owner.initials}
    </div>,
    { ...size },
  );
}
