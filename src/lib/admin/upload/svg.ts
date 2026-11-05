import { svgBodyToPaths } from '@/lib/content/icons/svg-geometry';
import { type SvgData, svgDataSchema } from '@/lib/content/schema';

export const MAX_SVG_BYTES = 20 * 1024;

const ALLOWED = new Set([
  'circle',
  'ellipse',
  'g',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'svg',
]);
const SHAPES = new Set(['circle', 'ellipse', 'path', 'polygon', 'rect']);
const GEOMETRY = new Set(['cx', 'cy', 'd', 'height', 'points', 'r', 'rx', 'ry', 'width', 'x', 'y']);
/**
 * Anything that changes how a shape paints is refused, never dropped silently.
 */
const PAINT =
  /^(?:transform|stroke(?:-.*)?|clip-path|clip-rule|fill-rule|mask|filter|opacity|fill-opacity|style|class|display|visibility)$/;

const TAG = /<(\/?)([a-z][\w:-]*)(?=[\s/>])((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/gi;
const ATTRIBUTE = /([a-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export type SvgResult = { message: string; ok: false } | { ok: true; svg: SvgData };

const fail = (message: string): SvgResult => ({ ok: false, message });

function attributesOf(source: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    map.set((match[1] as string).toLowerCase(), (match[2] ?? match[3] ?? '').trim());
  }

  return map;
}

function viewBoxOf(root: Map<string, string>): null | string {
  const raw = root.get('viewbox');

  if (raw) {
    const parts = raw.split(/[\s,]+/).map(Number);

    return parts.length === 4 && parts.every(Number.isFinite) ? parts.join(' ') : null;
  }

  const width = Number.parseFloat(root.get('width') ?? '');
  const height = Number.parseFloat(root.get('height') ?? '');

  return width > 0 && height > 0 ? `0 0 ${width} ${height}` : null;
}

/**
 * Strict allowlist parser for uploaded icons: only geometry survives, as data
 * (`viewBox` + path strings). Scripts, styles, `use`, `foreignObject`, images,
 * event handlers and external references are dropped with their content.
 * Transforms and strokes are refused, since dropping them would draw a
 * different shape than the file shows.
 */
export function sanitizeSvg(source: string): SvgResult {
  if (new TextEncoder().encode(source).length > MAX_SVG_BYTES) {
    return fail('SVG is larger than 20 KB');
  }

  if (/<!(?:DOCTYPE|ENTITY|\[CDATA\[)/i.test(source)) {
    return fail('DOCTYPE, entities and CDATA are not allowed');
  }

  const text = source.replace(/<!--[\s\S]*?-->/g, '').replace(/<\?[\s\S]*?\?>/g, '');

  let viewBox: null | string = null;
  let sawRoot = false;
  let skipping = 0;
  let body = '';

  for (const match of text.matchAll(TAG)) {
    const [, closing, rawName, rawAttrs, selfClosing] = match;
    const name = (rawName as string).toLowerCase();
    const attrs = attributesOf(rawAttrs ?? '');

    if (skipping > 0) {
      if (!selfClosing) skipping += closing ? -1 : 1;

      continue;
    }

    if (!ALLOWED.has(name)) {
      if (!closing && !selfClosing) skipping = 1;

      continue;
    }

    if (closing) continue;

    if (name === 'svg') {
      if (!sawRoot) {
        sawRoot = true;
        viewBox = viewBoxOf(attrs);
      }

      continue;
    }

    for (const attr of attrs.keys()) {
      if (PAINT.test(attr))
        return fail(`"${attr}" is not supported; convert strokes and transforms to plain outlines`);
    }

    if (name === 'g') {
      if (attrs.has('fill')) return fail('Group fills are not supported');

      continue;
    }

    if (!SHAPES.has(name)) return fail(`<${name}> is stroke-only; convert it to a filled outline`);

    const kept = [...attrs]
      .filter(([attr, value]) => GEOMETRY.has(attr) || (attr === 'fill' && value === 'none'))
      .map(([attr, value]) => `${attr}="${value.replace(/"/g, '')}"`);

    body += `<${name} ${kept.join(' ')}/>`;
  }

  if (!sawRoot) return fail('No <svg> element found');

  if (!viewBox) return fail('The <svg> needs a viewBox');

  const paths = svgBodyToPaths(body);

  if (!paths) return fail('Only filled paths and basic shapes are supported');

  const parsed = svgDataSchema.safeParse({ viewBox, paths });

  return parsed.success
    ? { ok: true, svg: parsed.data }
    : fail('The shapes use unsupported path commands');
}
