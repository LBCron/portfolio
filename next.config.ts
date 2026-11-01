import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { isHttpsSite, securityHeaders } from './src/lib/security/headers';

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
  experimental: {
    // ICU messages compile at build time, so the client ships the small
    // formatter instead of the ICU parser (D57).
    messages: {
      path: './messages',
      format: 'json',
      locales: 'infer',
      precompile: true,
    },
  },
});

const security = securityHeaders({
  dev: process.env.NODE_ENV === 'development',
  https: isHttpsSite(process.env['NEXT_PUBLIC_SITE_URL']),
});

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
  // Security headers go on every response, the anonymous admin 404 included, so
  // that 404 matches any other. The noindex headers for the admin come from the
  // proxy instead: adding them here would mark the anonymous 404s and give the
  // admin area away. The proxy also swaps in the admin's nonce CSP.
  async headers() {
    return [
      { source: '/:path*', headers: security },
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
    // Uploads go through the proxy, which buffers bodies up to this size.
    proxyClientMaxBodySize: '12mb',
    serverActions: { bodySizeLimit: '2mb' },
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
