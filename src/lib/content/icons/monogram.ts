/**
 * Deterministic monogram for technologies without a usable logo: short names
 * as-is ("SQL"), CamelCase capitals ("SharePoint" → "SP"), otherwise the
 * initials of the first two words.
 */
export function monogramFor(name: string): string {
  const words = name
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s/&+.-]/gu, '')
    .split(/[\s/&+.-]+/)
    .filter(Boolean);
  const [first, second] = words;

  if (!first) return '?';

  if (!second) {
    if (first.length <= 3) return first.toUpperCase();

    const capitals = first.match(/\p{Lu}/gu);

    if (capitals && capitals.length >= 2) {
      return capitals.slice(0, 2).join('');
    }

    return first.slice(0, 2).toUpperCase();
  }

  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase();
}
