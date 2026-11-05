import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { contrastRatio } from '@/lib/color';

const css = readFileSync(join(__dirname, 'globals.css'), 'utf8');
const themeBlock = /@theme\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';

function token(name: string) {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(themeBlock);

  if (!match?.[1]) throw new Error(`Missing token --color-${name}`);

  return match[1];
}

const surfaces = ['bg-0', 'bg-1', 'surface-1', 'surface-2'];
const foregrounds = [
  'text-1',
  'text-2',
  'text-3',
  'accent-1',
  'accent-2',
  'term-green',
  'warn',
  'danger',
];

describe('design tokens', () => {
  it.each(foregrounds.flatMap((fg) => surfaces.map((bg) => [fg, bg] as const)))(
    '%s on %s reaches 4.5:1',
    (fg, bg) => {
      expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(['text-1', 'text-2'])('%s body copy reaches 7:1 on bg-0', (fg) => {
    expect(contrastRatio(token(fg), token('bg-0'))).toBeGreaterThanOrEqual(7);
  });

  it('primary button label (bg-0 on text-1) reaches 7:1', () => {
    expect(contrastRatio(token('bg-0'), token('text-1'))).toBeGreaterThanOrEqual(7);
  });

  it('focus ring (accent-2) reaches 3:1 on every surface', () => {
    for (const bg of surfaces) {
      expect(contrastRatio(token('accent-2'), token(bg))).toBeGreaterThanOrEqual(3);
    }
  });
});
