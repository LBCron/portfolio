import anyConfig from 'eslint-config-any';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...anyConfig.next(),
  // The docs use GFM task lists (`- [ ]`), which CommonMark reads as label refs.
  { files: ['**/*.md'], language: 'markdown/gfm' },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message: 'Use Link from @/i18n/navigation on public pages.',
            },
          ],
          patterns: [
            {
              group: ['@sanity/*', 'groq-js', '**/lib/content/sanity/*'],
              message: 'Components never talk to Sanity; go through @/lib/content.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/content/**', 'scripts/**', 'tests/support/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  globalIgnores([
    '.next/**',
    '.cache/**',
    '.lighthouseci/**',
    '.vercel/**',
    'C:*/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'next-env.d.ts',
  ]),
]);
