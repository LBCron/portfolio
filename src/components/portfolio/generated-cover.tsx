import {
  Cable,
  GitBranch,
  Globe,
  type LucideIcon,
  Monitor,
  Smartphone,
  Workflow,
} from 'lucide-react';
import { useId } from 'react';

import { cn } from '@/lib/cn';
import { type ProjectKind } from '@/lib/content';

const GLYPHS: Record<ProjectKind, LucideIcon> = {
  'web': Globe,
  'mobile': Smartphone,
  'desktop': Monitor,
  'automation': Workflow,
  'integration': Cable,
  'open-source': GitBranch,
};

const PALETTES = [
  ['#8b7cff', '#4cc9f0'],
  ['#4cc9f0', '#4ade80'],
  ['#8b7cff', '#f472b6'],
  ['#fbbf24', '#8b7cff'],
  ['#4ade80', '#8b7cff'],
] as const;

/**
 * FNV-1a: a stable 32-bit seed from the slug.
 */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }

  return value >>> 0;
}

function seeded(seed: number) {
  let state = seed || 1;

  return (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return ((state >>> 0) % 10_000) / 10_000;
  };
}

/**
 * Deterministic abstract art for projects without a cover: gradient blobs, a
 * grid and a kind-specific glyph. Decorative; the card names the project.
 */
export function GeneratedCover({
  slug,
  kind,
  className,
}: {
  className?: string;
  kind: ProjectKind;
  slug: string;
}) {
  const id = useId();
  const random = seeded(hash(slug));
  const [from, to] = PALETTES[hash(slug) % PALETTES.length] ?? PALETTES[0];
  const blobs = [0, 1].map(() => ({
    cx: 20 + random() * 120,
    cy: 15 + random() * 70,
    r: 45 + random() * 35,
  }));
  const Glyph = GLYPHS[kind];

  return (
    <div
      aria-hidden="true"
      className={cn('relative size-full overflow-hidden bg-surface-2', className)}
    >
      <svg
        viewBox="0 0 160 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        focusable="false"
      >
        <defs>
          {blobs.map((_, index) => (
            <radialGradient key={index} id={`${id}-g${index}`}>
              <stop offset="0" stopColor={index === 0 ? from : to} stopOpacity="0.75" />
              <stop offset="1" stopColor={index === 0 ? from : to} stopOpacity="0" />
            </radialGradient>
          ))}
          <pattern id={`${id}-grid`} width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M8 0H0V8" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="160" height="100" fill="#11141b" />
        {blobs.map((blob, index) => (
          <circle key={index} {...blob} fill={`url(#${id}-g${index})`} />
        ))}
        <rect width="160" height="100" fill={`url(#${id}-grid)`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-16 items-center justify-center rounded-xl border border-line-strong glass">
          <Glyph className="size-7 text-text-1" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}
