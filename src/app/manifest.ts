import { type MetadataRoute } from 'next';

import { owner, THEME_COLOR } from '@/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: owner.name,
    short_name: owner.shortName,
    description: `${owner.jobTitle} in ${owner.city}, ${owner.country}.`,
    start_url: '/en',
    display: 'standalone',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: '/icon', type: 'image/png', sizes: '32x32' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
