/**
 * Fibonacci / golden-ratio geoid used by the tech cloud (D37). Pure math — no
 * DOM — so Vitest can exercise it without a browser.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export interface GeoidPoint {
  floatOffset: number;
  floatSpeed: number;
  /**
   * Polar angle from +Y (0…π).
   */
  phi: number;
  /**
   * Per-item radius scale (0.8–1.2).
   */
  radiusMultiplier: number;
  /**
   * Auto-spin rad/frame-unit (faster near the poles).
   */
  rotationSpeed: number;
  /**
   * Initial azimuth.
   */
  theta: number;
}

/**
 * Evenly spaced seeds on a unit sphere, then geoid-jittered like the prototype.
 */
export function fibonacciGeoid(
  count: number,
  /**
   * Deterministic RNG in [0, 1) — inject in tests.
   */
  random: () => number = Math.random,
): GeoidPoint[] {
  if (count <= 0) return [];

  const points: GeoidPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const phi = Math.acos(1 - 2 * t);
    const theta = GOLDEN_ANGLE * i;
    const distanceFromEquator = Math.abs(phi - Math.PI / 2) / (Math.PI / 2);

    points.push({
      phi,
      theta,
      radiusMultiplier: 0.8 + random() * 0.4,
      rotationSpeed: 0.001 + distanceFromEquator ** 2 * 0.004,
      floatOffset: random() * Math.PI * 2,
      floatSpeed: 0.0005 + random() * 0.001,
    });
  }

  return points;
}

export interface ProjectedIcon {
  /**
   * True when the icon faces the camera (front hemisphere).
   */
  interactive: boolean;
  opacity: number;
  scale: number;
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

/**
 * Spherical → screen projection for a rectangular stage (D40). X/Y fill 40% of
 * width/height so the cloud occupies the stage; Z uses the shorter axis for
 * depth. Depth drives scale (0.25–1.6) and opacity (0.15–1).
 */
export function projectGeoidIcon(input: {
  floatY: number;
  height: number;
  phi: number;
  radiusMultiplier: number;
  theta: number;
  width: number;
}): ProjectedIcon {
  const { phi, theta, radiusMultiplier, floatY, width, height } = input;
  const rx = width * 0.4 * radiusMultiplier;
  const ry = height * 0.4 * radiusMultiplier;
  const rz = Math.min(width, height) * 0.4 * radiusMultiplier;
  const x = rx * Math.sin(phi) * Math.cos(theta);
  const y = ry * Math.cos(phi) + floatY;
  const z = rz * Math.sin(phi) * Math.sin(theta);
  const maxRadiusZ = Math.min(width, height) * 0.4 * 1.2;
  const zNormalized = (z + maxRadiusZ) / (2 * maxRadiusZ);

  return {
    x,
    y,
    z,
    scale: 0.25 + zNormalized * 1.35,
    opacity: 0.15 + zNormalized * 0.85,
    interactive: z > 0,
    zIndex: Math.round(z),
  };
}

/**
 * Brand fill that stays visible on near-black (D37 luminance correction).
 */
export function cloudIconFill(brandColor: string | undefined, fallback = '#a3a9b8'): string {
  if (!brandColor) return fallback;

  try {
    // Inline to keep this module free of server-only imports in client bundles.
    const match = /^#?([0-9a-f]{6})$/i.exec(brandColor.trim());

    if (!match?.[1]) return fallback;

    const value = Number.parseInt(match[1], 16);
    const r = ((value >> 16) & 255) / 255;
    const g = ((value >> 8) & 255) / 255;
    const b = (value & 255) / 255;
    const channel = (c: number): number =>
      c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

    return luminance < 0.25 ? '#e8eaf0' : brandColor;
  } catch {
    return fallback;
  }
}
