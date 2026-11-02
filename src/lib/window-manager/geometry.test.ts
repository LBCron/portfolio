import { describe, expect, it } from 'vitest';

import {
  clampRect,
  defaultRect,
  MIN_SIZE,
  MIN_VISIBLE,
  maximizedRect,
  resizeRect,
  snapRect,
  SNAP_RELEASE,
  snapSideAt,
  TITLE_BAR_HEIGHT,
  type Viewport,
} from './geometry';

const viewport: Viewport = { width: 1280, height: 800, top: 64 };

describe('defaultRect', () => {
  it('sits bottom-right with a 24px margin', () => {
    expect(defaultRect(viewport)).toEqual({
      x: 1280 - 640 - 24,
      y: 800 - 420 - 24,
      width: 640,
      height: 420,
    });
  });

  it('shrinks to the viewport minus 48px', () => {
    const rect = defaultRect({ width: 500, height: 400, top: 56 });
    expect(rect.width).toBe(452);
    expect(rect.height).toBe(400 - 56 - 48);
  });
});

describe('clampRect', () => {
  it('keeps 96px of the title bar visible on every side', () => {
    const right = clampRect(
      { x: 5000, y: 100, width: 640, height: 420 },
      viewport,
    );
    expect(right.x).toBe(viewport.width - MIN_VISIBLE);
    const left = clampRect(
      { x: -5000, y: 100, width: 640, height: 420 },
      viewport,
    );
    expect(left.x + left.width).toBe(MIN_VISIBLE);
    const bottom = clampRect(
      { x: 0, y: 5000, width: 640, height: 420 },
      viewport,
    );
    expect(bottom.y).toBe(viewport.height - TITLE_BAR_HEIGHT);
  });

  it('never slides under the header', () => {
    expect(clampRect({ x: 0, y: 0, width: 640, height: 420 }, viewport).y).toBe(
      64,
    );
  });

  it('enforces the minimum and maximum size', () => {
    const small = clampRect({ x: 0, y: 100, width: 10, height: 10 }, viewport);
    expect([small.width, small.height]).toEqual([
      MIN_SIZE.width,
      MIN_SIZE.height,
    ]);
    const big = clampRect(
      { x: 0, y: 100, width: 9999, height: 9999 },
      viewport,
    );
    expect([big.width, big.height]).toEqual([1280, 800 - 64]);
  });
});

describe('snapping', () => {
  it('maximizes below the header and halves left and right', () => {
    expect(maximizedRect(viewport)).toEqual({
      x: 0,
      y: 64,
      width: 1280,
      height: 736,
    });
    expect(snapRect('left', viewport)).toEqual({
      x: 0,
      y: 64,
      width: 640,
      height: 736,
    });
    expect(snapRect('right', viewport)).toEqual({
      x: 640,
      y: 64,
      width: 640,
      height: 736,
    });
    expect(snapRect('top', viewport)).toEqual(maximizedRect(viewport));
  });

  it('arms snapping only at the edges', () => {
    expect(snapSideAt({ x: 600, y: 3 }, viewport)).toBe('top');
    expect(snapSideAt({ x: 600, y: 70 }, viewport)).toBeNull();
    expect(snapSideAt({ x: 2, y: 400 }, viewport)).toBe('left');
    expect(snapSideAt({ x: 1278, y: 400 }, viewport)).toBe('right');
    expect(snapSideAt({ x: 600, y: 400 }, viewport)).toBeNull();
  });

  it('keeps an armed side until the pointer leaves the release band', () => {
    expect(snapSideAt({ x: 20, y: 400 }, viewport)).toBeNull();
    expect(snapSideAt({ x: 20, y: 400 }, viewport, 'left')).toBe('left');
    expect(snapSideAt({ x: SNAP_RELEASE, y: 400 }, viewport, 'left')).toBe(
      'left',
    );
    expect(
      snapSideAt({ x: SNAP_RELEASE + 1, y: 400 }, viewport, 'left'),
    ).toBeNull();
    expect(snapSideAt({ x: 1250, y: 400 }, viewport, 'right')).toBe('right');
    expect(snapSideAt({ x: 600, y: 30 }, viewport, 'top')).toBe('top');
    expect(snapSideAt({ x: 600, y: 40 }, viewport, 'top')).toBeNull();
  });

  it('an armed side wins over a corner, and a new edge can take over', () => {
    expect(snapSideAt({ x: 2, y: 3 }, viewport, 'left')).toBe('left');
    expect(snapSideAt({ x: 2, y: 3 }, viewport)).toBe('top');
    expect(snapSideAt({ x: 1278, y: 400 }, viewport, 'left')).toBe('right');
  });
});

describe('resizeRect', () => {
  const start = { x: 400, y: 200, width: 600, height: 400 };

  it('grows from the south-east corner keeping the origin', () => {
    expect(resizeRect(start, 'se', 50, 30, viewport)).toEqual({
      ...start,
      width: 650,
      height: 430,
    });
  });

  it('anchors the opposite edge when resizing from the west and north', () => {
    const next = resizeRect(start, 'nw', -100, -50, viewport);
    expect(next.x + next.width).toBe(start.x + start.width);
    expect(next.y + next.height).toBe(start.y + start.height);
    expect(next.width).toBe(700);
    expect(next.height).toBe(450);
  });

  it('respects the minimum size while keeping the anchor', () => {
    const next = resizeRect(start, 'w', 900, 0, viewport);
    expect(next.width).toBe(MIN_SIZE.width);
    expect(next.x + next.width).toBe(start.x + start.width);
  });
});
