/**
 * Converts the geometry of a trusted SVG fragment (icon packages) into path
 * data. Returns `null` when the markup uses anything this subset cannot
 * represent faithfully (transforms, gradients, strokes, masks…), so callers can
 * fall back instead of rendering a wrong mark.
 */

const SHAPE = /<(path|circle|ellipse|rect|polygon)\b([^>]*?)\/?>/g;
const ATTRIBUTE = /([a-z:-]+)\s*=\s*"([^"]*)"/gi;
const UNSUPPORTED =
  /<(?:g|defs|use|mask|clipPath|linearGradient|radialGradient|pattern|filter|image|text|style|script|foreignObject|line|polyline)\b|\btransform\s*=|\bstroke\s*=|\bfill-rule\s*=\s*"evenodd"|\bclip-rule\s*=/;

function attributes(source: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    const [, name, value] = match;

    if (name && value !== undefined) map.set(name, value.trim());
  }

  return map;
}

function num(attrs: Map<string, string>, name: string): number {
  const value = Number(attrs.get(name) ?? 0);

  return Number.isFinite(value) ? value : Number.NaN;
}

function fmt(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

function shapeToPath(tag: string, attrs: Map<string, string>): null | string {
  switch (tag) {
    case 'circle':
    case 'ellipse': {
      const cx = num(attrs, 'cx');
      const cy = num(attrs, 'cy');
      const rx = tag === 'circle' ? num(attrs, 'r') : num(attrs, 'rx');
      const ry = tag === 'circle' ? rx : num(attrs, 'ry');

      if (![cx, cy, rx, ry].every(Number.isFinite) || rx <= 0 || ry <= 0) {
        return null;
      }

      return `M${fmt(cx - rx)} ${fmt(cy)}a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(2 * rx)} 0a${fmt(rx)} ${fmt(ry)} 0 1 0 ${fmt(-2 * rx)} 0Z`;
    }
    case 'path':
      return attrs.get('d') || null;
    case 'polygon': {
      const points = (attrs.get('points') ?? '')
        .trim()
        .split(/[\s,]+/)
        .map(Number);

      if (points.length < 6 || points.length % 2 !== 0) return null;

      if (!points.every(Number.isFinite)) return null;

      const pairs: string[] = [];
      for (let i = 0; i < points.length; i += 2) {
        pairs.push(`${fmt(points[i] ?? 0)} ${fmt(points[i + 1] ?? 0)}`);
      }

      return `M${pairs.join('L')}Z`;
    }
    case 'rect': {
      const x = num(attrs, 'x');
      const y = num(attrs, 'y');
      const width = num(attrs, 'width');
      const height = num(attrs, 'height');

      if (attrs.has('rx') || attrs.has('ry')) return null;

      if (![x, y, width, height].every(Number.isFinite)) return null;

      return `M${fmt(x)} ${fmt(y)}h${fmt(width)}v${fmt(height)}h${fmt(-width)}Z`;
    }
    default:
      return null;
  }
}

/**
 * Path data for every filled shape, or `null` if the markup is unsupported.
 */
export function svgBodyToPaths(body: string): null | string[] {
  if (UNSUPPORTED.test(body)) return null;

  const paths: string[] = [];
  for (const match of body.matchAll(SHAPE)) {
    const [, tag, rawAttributes] = match;

    if (!tag) continue;

    const attrs = attributes(rawAttributes ?? '');

    if (attrs.get('fill') === 'none') continue;

    const opacity = attrs.get('opacity') ?? attrs.get('fill-opacity');

    if (opacity !== undefined && Number(opacity) === 0) continue;

    const d = shapeToPath(tag, attrs);

    if (d === null) return null;

    paths.push(d.replace(/\s+/g, ' '));
  }

  return paths.length > 0 ? paths : null;
}
