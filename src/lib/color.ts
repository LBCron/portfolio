function channel(value: number) {
  const c = value / 255;

  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function parseHex(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());

  if (!match?.[1]) throw new Error(`Not a 6-digit hex color: ${hex}`);

  const value = Number.parseInt(match[1], 16);

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * WCAG 2.x relative luminance.
 */
export function relativeLuminance(hex: string) {
  const [r, g, b] = parseHex(hex);

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];

  return (light + 0.05) / (dark + 0.05);
}
