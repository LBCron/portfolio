import { GeistSans } from 'geist/font/sans';
import localFont from 'next/font/local';

export const fontSans = GeistSans;

export const fontMono = localFont({
  src: '../fonts/jetbrains-mono-variable.woff2',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas'],
  // Metric overrides are computed against a sans fallback, which would
  // distort a monospace fallback; mono text is never the LCP element.
  adjustFontFallback: false,
  // Only labels use it: fetched when the CSS needs it instead of competing
  // with the document and Geist on a slow first load (D59).
  preload: false,
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
