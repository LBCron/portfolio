import { type CSSProperties } from 'react';

const COLUMNS = 32;
const GLYPHS = '0123456789ABCDEF<>/{}[]=+#$%&*';
const LENGTH = 22;

/**
 * Xorshift32: the same rain every time, no Math.random in render.
 */
function seeded(seed: number) {
  let state = seed;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 0x1_0000_0000;
  };
}

const random = seeded(0x2f6b_9a1d);
const COLUMN_DATA = Array.from({ length: COLUMNS }, () => ({
  text: Array.from(
    { length: LENGTH },
    () => GLYPHS[Math.floor(random() * GLYPHS.length)] ?? '0',
  ).join('\n'),
  duration: 1.4 + random() * 1.4,
  delay: random() * 1.2,
  opacity: 0.45 + random() * 0.55,
}));

/**
 * Green rain over the terminal body for `matrix` (§10.4). Pure CSS: each column
 * falls with a transform animation (no per-frame React work, no glyph swapping,
 * so nothing flashes). Decorative and click-through; it is never mounted with
 * reduced motion, and the global reduced-motion rule stops it if Pause
 * animations is switched on mid-way.
 */
export function MatrixRain() {
  return (
    <div
      aria-hidden="true"
      data-effect="matrix"
      className="decorative matrix-rain pointer-events-none absolute inset-0 overflow-hidden bg-bg-0/80"
    >
      {COLUMN_DATA.map((column, index) => (
        <span
          key={index}
          className="matrix-column"
          style={
            {
              'left': `${(index / COLUMNS) * 100}%`,
              'opacity': column.opacity,
              '--fall': `${column.duration.toFixed(2)}s`,
              '--wait': `${column.delay.toFixed(2)}s`,
            } as CSSProperties
          }
        >
          {column.text}
        </span>
      ))}
    </div>
  );
}
