/**
 * Frame-time and drag math for the tech cloud (D66). Pure functions — no DOM —
 * so Vitest can prove refresh-rate independence.
 *
 * Every per-frame constant in the geoid (spin, easing, friction) was tuned at
 * 60 Hz. Scaling by `frameScale` keeps the same speed at 90 / 120 / 144 Hz.
 */

/**
 * One frame at 60 Hz, the unit all per-frame constants are expressed in.
 */
export const FRAME_MS = 1000 / 60;
/**
 * A stalled frame never counts for more than this, so the scene can't jump.
 */
export const MAX_FRAME_MS = 50;

/**
 * How many 60 Hz frames this gap is worth, clamped for stalls.
 */
export function frameScale(gapMs: number): number {
  return Math.min(Math.max(gapMs, 0), MAX_FRAME_MS) / FRAME_MS;
}

/**
 * A per-frame decay factor (e.g. 0.95 friction) applied over `k` frames.
 */
export function decay(perFrame: number, k: number): number {
  return perFrame ** k;
}

/**
 * A per-frame lerp factor (e.g. 0.08) applied over `k` frames.
 */
export function ease(perFrame: number, k: number): number {
  return 1 - (1 - perFrame) ** k;
}

/**
 * Friction per 60 Hz frame once the pointer is released.
 */
export const COAST_FRICTION = 0.95;
/**
 * Decay per 60 Hz frame while the pointer is held but not moving.
 */
export const HOLD_FRICTION = 0.8;

const REST = 0.000_001;

export interface DragStep {
  /**
   * Rotation to add to every item this frame (rad).
   */
  rotation: number;
  /**
   * Coast velocity (rad per 60 Hz frame) to carry into the next frame.
   */
  velocity: number;
}

/**
 * One drag/coast step.
 *
 * `pending` is the pointer travel (already converted to rad) accumulated since
 * the previous frame, so total rotation follows total distance rather than the
 * pointer's event rate. `gapMs` is the real time since the previous frame.
 */
export function stepDrag(input: {
  dragging: boolean;
  gapMs: number;
  pending: number;
  velocity: number;
}): DragStep {
  const { pending, dragging } = input;
  let { velocity } = input;
  // Real gap for velocity (a stall must not inflate the coast); clamped k for
  // easing and friction.
  const gapFrames = Math.max(input.gapMs, 0) / FRAME_MS || 1;
  const k = frameScale(input.gapMs);

  if (dragging) {
    // Only a frame that actually moved sets the coast speed, so releasing after
    // a pause doesn't launch a stale flick.
    velocity = pending === 0 ? velocity * decay(HOLD_FRICTION, k) : pending / gapFrames;

    return { velocity, rotation: pending };
  }

  // A flick released between frames still seeds the coast.
  if (pending !== 0) {
    const flick = pending / gapFrames;

    if (Math.abs(flick) > Math.abs(velocity) || Math.abs(velocity) < REST) {
      velocity = flick;
    }
  }

  velocity *= decay(COAST_FRICTION, k);

  if (Math.abs(velocity) < REST) velocity = 0;

  return { velocity, rotation: pending + velocity * k };
}
