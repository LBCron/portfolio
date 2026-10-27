import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  // Large data-only packages resolved on the server at runtime, not bundled.
  serverExternalPackages: [
    'simple-icons',
    '@iconify-json/devicon',
    '@iconify-json/devicon-plain',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75],
    maximumRedirects: 0,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/images/**' },
    ],
    localPatterns: [{ pathname: '/fixtures/images/**', search: '' }],
  },
  // Admin responses get theirs from the proxy; adding them here would also mark
  // the anonymous 404s and give the admin area away.
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value:
              'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate, noai, noimageai',
          },
        ],
      },
    ];
  },
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
