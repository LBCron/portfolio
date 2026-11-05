/**
 * ASCII kebab-case slug: "Fable & Co." → "fable-co".
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Slugs for a list of names; collisions get `-2`, `-3`… in list order.
 */
export function uniqueSlugs(names: readonly string[]): string[] {
  const used = new Set<string>();

  return names.map((name) => {
    const base = slugify(name) || 'item';
    let candidate = base;
    for (let n = 2; used.has(candidate); n += 1) candidate = `${base}-${n}`;
    used.add(candidate);

    return candidate;
  });
}
