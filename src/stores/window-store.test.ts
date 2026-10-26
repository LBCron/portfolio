import { beforeEach, describe, expect, it } from 'vitest';

import { useWindowStore } from './window-store';

const viewport = { width: 1280, height: 800, top: 64 };
const get = () => useWindowStore.getState();
const win = () => get().windows['t']!;

beforeEach(() => {
  useWindowStore.setState({ windows: {}, zCounter: 0, viewport });
});

describe('window store', () => {
  it('opens at the default rect, focused', () => {
    get().open('t', 'Terminal');
    expect(win()).toMatchObject({
      status: 'open',
      focused: true,
      maximized: false,
      rect: { x: 616, y: 356, width: 640, height: 420 },
    });
  });

  it('minimizes, restores and closes without losing geometry', () => {
    get().open('t', 'Terminal');
    const { rect } = win();
    get().minimize('t');
    expect(win()).toMatchObject({ status: 'minimized', focused: false, rect });
    get().restore('t');
    expect(win()).toMatchObject({ status: 'open', focused: true, rect });
    get().close('t');
    expect(win().status).toBe('closed');
  });

  it('toggles maximize and keeps the restored rect', () => {
    get().open('t', 'Terminal');
    const { rect } = win();
    get().toggleMaximize('t');
    expect(win().maximized).toBe(true);
    expect(win().rect).toEqual(rect);
    get().toggleMaximize('t');
    expect(win().maximized).toBe(false);
  });

  it('clamps moves and resizes to the viewport', () => {
    get().open('t', 'Terminal');
    get().moveTo('t', 9999, 0);
    expect(win().rect.x).toBe(1280 - 96);
    expect(win().rect.y).toBe(64);
    get().resizeTo('t', { x: 0, y: 100, width: 50, height: 50 });
    expect([win().rect.width, win().rect.height]).toEqual([360, 240]);
  });

  it('snaps to halves and to maximized', () => {
    get().open('t', 'Terminal');
    get().snap('t', 'left');
    expect(win().rect).toEqual({ x: 0, y: 64, width: 640, height: 736 });
    get().snap('t', 'top');
    expect(win().maximized).toBe(true);
  });

  it('re-clamps every window when the viewport shrinks', () => {
    get().open('t', 'Terminal');
    get().setViewport({ width: 700, height: 500, top: 56 });
    expect(win().rect.x).toBeLessThanOrEqual(700 - 96);
    expect(win().rect.y).toBeLessThanOrEqual(500 - 40);
  });

  it('raises with an incrementing counter and blurs the others', () => {
    get().open('a', 'A');
    get().open('b', 'B');
    expect(get().windows['b']!.zIndex).toBeGreaterThan(
      get().windows['a']!.zIndex,
    );
    get().focus('a');
    expect(get().windows['a']).toMatchObject({ focused: true });
    expect(get().windows['b']!.focused).toBe(false);
    expect(get().windows['a']!.zIndex).toBeGreaterThan(
      get().windows['b']!.zIndex,
    );
  });

  it('does not grow the counter when refocusing the top window', () => {
    get().open('t', 'Terminal');
    const before = get().zCounter;
    get().focus('t');
    get().focus('t');
    expect(get().zCounter).toBe(before);
  });
});
