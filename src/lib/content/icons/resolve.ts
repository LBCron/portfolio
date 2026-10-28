import 'server-only';

import type { IconifyJSON } from '@iconify/types';
import type { SimpleIcon } from 'simple-icons';

import type { SvgData, TechnologyDocument } from '../schema';
import type { LinkIcon, TechIcon } from '../types';
import { monogramFor } from './monogram';
import { svgBodyToPaths } from './svg-geometry';

export type IconSourceUsed =
  'simple-icons' | 'devicon-plain' | 'devicon' | 'custom-svg' | 'monogram';

export interface ResolvedTechIcon {
  icon: TechIcon;
  source: IconSourceUsed;
  /** Simple Icons publishes brand colors; Devicon does not. */
  defaultBrandColor?: string;
}

let simpleIconsBySlug: Promise<Map<string, SimpleIcon>> | undefined;
let deviconSets: Promise<IconifyJSON[]> | undefined;

function loadSimpleIcons(): Promise<Map<string, SimpleIcon>> {
  simpleIconsBySlug ??= import('simple-icons').then((module) => {
    const map = new Map<string, SimpleIcon>();
    for (const value of Object.values(module)) {
      if (value && typeof value === 'object' && 'slug' in value) {
        const icon = value as SimpleIcon;
        map.set(icon.slug, icon);
      }
    }
    return map;
  });
  return simpleIconsBySlug;
}

function loadDevicon(): Promise<IconifyJSON[]> {
  deviconSets ??= Promise.all([
    import('@iconify-json/devicon-plain').then((module) => module.icons),
    import('@iconify-json/devicon').then((module) => module.icons),
  ]);
  return deviconSets;
}

/** Every Simple Icons brand, for the admin picker. */
export async function simpleIconCatalog() {
  return [...(await loadSimpleIcons()).values()].map((icon) => ({
    slug: icon.slug,
    label: icon.title,
  }));
}

/** Every Devicon name (plain and original sets), for the admin picker. */
export async function deviconCatalog() {
  const sets = await loadDevicon();
  return [...new Set(sets.flatMap((set) => Object.keys(set.icons)))]
    .sort()
    .map((slug) => ({ slug, label: slug }));
}

export async function simpleIcon(slug: string): Promise<SvgData | null> {
  const icon = (await loadSimpleIcons()).get(slug);
  return icon ? { viewBox: '0 0 24 24', paths: [icon.path] } : null;
}

function iconifyIcon(set: IconifyJSON, slug: string): SvgData | null {
  const name = set.icons[slug] ? slug : set.aliases?.[slug]?.parent;
  const icon = name ? set.icons[name] : undefined;
  if (!icon) return null;
  const paths = svgBodyToPaths(icon.body);
  if (!paths) return null;
  const left = icon.left ?? set.left ?? 0;
  const top = icon.top ?? set.top ?? 0;
  const width = icon.width ?? set.width ?? 16;
  const height = icon.height ?? set.height ?? 16;
  return { viewBox: `${left} ${top} ${width} ${height}`, paths };
}

/**
 * Logo for a technology: the configured source first, then a monogram. Returns
 * the source actually used so `icons:audit` can report fallbacks.
 */
export async function resolveTechIcon(
  tech: Pick<
    TechnologyDocument,
    'name' | 'iconSource' | 'iconSlug' | 'customSvg' | 'monogram'
  >,
): Promise<ResolvedTechIcon> {
  const monogram: ResolvedTechIcon = {
    icon: { monogram: tech.monogram ?? monogramFor(tech.name) },
    source: 'monogram',
  };

  switch (tech.iconSource) {
    case 'simple-icons': {
      if (!tech.iconSlug) return monogram;
      const icon = (await loadSimpleIcons()).get(tech.iconSlug);
      if (!icon) return monogram;
      return {
        icon: { viewBox: '0 0 24 24', paths: [icon.path] },
        source: 'simple-icons',
        defaultBrandColor: `#${icon.hex}`,
      };
    }
    case 'devicon': {
      if (!tech.iconSlug) return monogram;
      const [plain, original] = await loadDevicon();
      const fromPlain = plain ? iconifyIcon(plain, tech.iconSlug) : null;
      if (fromPlain) return { icon: fromPlain, source: 'devicon-plain' };
      const fromOriginal = original
        ? iconifyIcon(original, tech.iconSlug)
        : null;
      if (fromOriginal) return { icon: fromOriginal, source: 'devicon' };
      return monogram;
    }
    case 'custom-svg':
      return tech.customSvg
        ? { icon: tech.customSvg, source: 'custom-svg' }
        : monogram;
    case 'monogram':
      return monogram;
  }
}

/** `simple-icons:<slug>` → brand path; `lucide:<name>` and `link` → Lucide. */
export async function resolveLinkIcon(icon: string): Promise<LinkIcon> {
  if (icon.startsWith('simple-icons:')) {
    const svg = await simpleIcon(icon.slice('simple-icons:'.length));
    if (svg) return { type: 'svg', ...svg };
    return { type: 'lucide', name: 'link' };
  }
  if (icon.startsWith('lucide:')) {
    return { type: 'lucide', name: icon.slice('lucide:'.length) };
  }
  return { type: 'lucide', name: 'link' };
}
