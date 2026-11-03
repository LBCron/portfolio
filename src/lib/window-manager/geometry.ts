export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Visible area available to windows; `top` is the fixed header offset. */
export interface Viewport {
  width: number;
  height: number;
  top: number;
}

export type SnapSide = 'left' | 'right' | 'top';
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const MIN_SIZE = { width: 360, height: 240 } as const;
export const DEFAULT_SIZE = { width: 640, height: 420 } as const;
export const EDGE_MARGIN = 24;
export const TITLE_BAR_HEIGHT = 40;
/** Part of the title bar that must always stay on screen. */
export const MIN_VISIBLE = 96;
/** Pointer distance from a viewport edge that arms snapping. */
export const SNAP_THRESHOLD = 8;
/**
 * An armed snap holds until the pointer is this far from its edge, so a
 * pointer hovering at the threshold cannot make the preview flicker.
 */
export const SNAP_RELEASE = 32;
/** Below this width the window becomes a bottom sheet. */
export const SHEET_BREAKPOINT = 640;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function clampRect(rect: Rect, viewport: Viewport): Rect {
  const width = clamp(rect.width, MIN_SIZE.width, viewport.width);
  const height = clamp(
    rect.height,
    MIN_SIZE.height,
    viewport.height - viewport.top,
  );
  return {
    width,
    height,
    x: clamp(rect.x, MIN_VISIBLE - width, viewport.width - MIN_VISIBLE),
    y: clamp(rect.y, viewport.top, viewport.height - TITLE_BAR_HEIGHT),
  };
}

/** Bottom-right, 24px from the edges, 640×420 shrunk to viewport − 48px. */
export function defaultRect(viewport: Viewport): Rect {
  const width = Math.min(DEFAULT_SIZE.width, viewport.width - 2 * EDGE_MARGIN);
  const height = Math.min(
    DEFAULT_SIZE.height,
    viewport.height - viewport.top - 2 * EDGE_MARGIN,
  );
  return clampRect(
    {
      width,
      height,
      x: viewport.width - width - EDGE_MARGIN,
      y: viewport.height - height - EDGE_MARGIN,
    },
    viewport,
  );
}

export function maximizedRect(viewport: Viewport): Rect {
  return {
    x: 0,
    y: viewport.top,
    width: viewport.width,
    height: viewport.height - viewport.top,
  };
}

export function snapRect(side: SnapSide, viewport: Viewport): Rect {
  const full = maximizedRect(viewport);
  if (side === 'top') return full;
  const width = Math.round(viewport.width / 2);
  return {
    ...full,
    width,
    x: side === 'left' ? 0 : viewport.width - width,
  };
}

function edgeDistance(
  side: SnapSide,
  pointer: { x: number; y: number },
  viewport: Viewport,
) {
  if (side === 'top') return pointer.y;
  if (side === 'left') return pointer.x;
  return viewport.width - pointer.x;
}

/**
 * The edge a drag would snap to. `armed` is the side already previewed: it
 * stays armed within `SNAP_RELEASE` (hysteresis), new sides arm within
 * `SNAP_THRESHOLD`.
 */
export function snapSideAt(
  pointer: { x: number; y: number },
  viewport: Viewport,
  armed: SnapSide | null = null,
): SnapSide | null {
  if (armed && edgeDistance(armed, pointer, viewport) <= SNAP_RELEASE) {
    return armed;
  }
  // The window is clamped below the header, so only the pointer can reach 0.
  if (pointer.y <= SNAP_THRESHOLD) return 'top';
  if (pointer.x <= SNAP_THRESHOLD) return 'left';
  if (pointer.x >= viewport.width - SNAP_THRESHOLD) return 'right';
  return null;
}

/** Resizes from one edge or corner; the opposite edge stays anchored. */
export function resizeRect(
  start: Rect,
  edge: ResizeEdge,
  dx: number,
  dy: number,
  viewport: Viewport,
): Rect {
  let { x, y, width, height } = start;
  if (edge.includes('e')) width = Math.max(MIN_SIZE.width, start.width + dx);
  if (edge.includes('s')) height = Math.max(MIN_SIZE.height, start.height + dy);
  // Clamp the size before deriving the position, so clampRect never has to
  // move the origin and the anchored edge cannot drift.
  if (edge.includes('w')) {
    width = clamp(start.width - dx, MIN_SIZE.width, viewport.width);
    x = start.x + start.width - width;
  }
  if (edge.includes('n')) {
    const bottom = start.y + start.height;
    height = clamp(
      start.height - dy,
      MIN_SIZE.height,
      Math.min(bottom - viewport.top, viewport.height - viewport.top),
    );
    y = bottom - height;
  }
  return clampRect({ x, y, width, height }, viewport);
}
