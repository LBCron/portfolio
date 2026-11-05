import { describe, expect, it } from 'vitest';

import { decay, ease, FRAME_MS, frameScale, MAX_FRAME_MS, stepDrag } from './motion';

/**
 * Integrates `step` over one second at the given refresh rate.
 */
function simulate(hz: number, step: (k: number, gapMs: number) => void) {
  const gap = 1000 / hz;
  for (let i = 0; i < hz; i += 1) step(frameScale(gap), gap);
}

describe('frameScale', () => {
  it('is 1 at 60 Hz and scales with the gap', () => {
    expect(frameScale(FRAME_MS)).toBeCloseTo(1);
    expect(frameScale(1000 / 144)).toBeCloseTo(60 / 144);
  });

  it('clamps stalls and negative gaps', () => {
    expect(frameScale(2000)).toBeCloseTo(MAX_FRAME_MS / FRAME_MS);
    expect(frameScale(-5)).toBe(0);
  });
});

describe('refresh-rate independence', () => {
  it('auto-spin covers the same angle per second at 60 and 144 Hz', () => {
    const total = (hz: number) => {
      let angle = 0;

      simulate(hz, (k) => {
        angle += 0.004 * k;
      });

      return angle;
    };

    expect(total(144)).toBeCloseTo(total(60), 6);
    expect(total(90)).toBeCloseTo(total(60), 6);
  });

  it('hover easing settles to the same value at any rate', () => {
    const settle = (hz: number) => {
      let value = 1;

      simulate(hz, (k) => {
        value += (0.05 - value) * ease(0.08, k);
      });

      return value;
    };

    expect(settle(144)).toBeCloseTo(settle(60), 6);
    expect(settle(120)).toBeCloseTo(settle(60), 6);
  });

  it('friction decays equally over one second', () => {
    const rate = (hz: number) => {
      let v = 1;

      simulate(hz, (k) => {
        v *= decay(0.95, k);
      });

      return v;
    };

    expect(rate(144)).toBeCloseTo(rate(60), 6);
  });

  it('a coast after release travels the same distance at 60 and 144 Hz', () => {
    const travel = (hz: number) => {
      let velocity = 0.02;
      let total = 0;

      simulate(hz, (_k, gapMs) => {
        const out = stepDrag({ velocity, pending: 0, dragging: false, gapMs });
        velocity = out.velocity;
        total += out.rotation;
      });

      return total;
    };

    // Discrete sums of the same decay curve: equal within the step size.
    expect(travel(144) / travel(60)).toBeGreaterThan(0.95);
    expect(travel(144) / travel(60)).toBeLessThan(1.05);
  });
});

describe('stepDrag', () => {
  it('rotates by the accumulated travel, not the event count', () => {
    // Same 0.3 rad of pointer travel, delivered as 1 or as 8 events.
    const one = stepDrag({
      velocity: 0,
      pending: 0.3,
      dragging: true,
      gapMs: FRAME_MS,
    });
    let pending = 0;
    for (let i = 0; i < 8; i += 1) pending += 0.3 / 8;
    const many = stepDrag({
      velocity: 0,
      pending,
      dragging: true,
      gapMs: FRAME_MS,
    });

    expect(many.rotation).toBeCloseTo(one.rotation, 10);
  });

  it('does not keep turning when the pointer is held still', () => {
    let velocity = 0.05;
    let total = 0;
    for (let i = 0; i < 120; i += 1) {
      const out = stepDrag({
        velocity,
        pending: 0,
        dragging: true,
        gapMs: FRAME_MS,
      });
      velocity = out.velocity;
      total += out.rotation;
    }
    expect(total).toBe(0);
    expect(Math.abs(velocity)).toBeLessThan(1e-6);
  });

  it('a stall does not inflate the release coast', () => {
    const normal = stepDrag({
      velocity: 0,
      pending: 0.01,
      dragging: false,
      gapMs: FRAME_MS,
    });
    const stalled = stepDrag({
      velocity: 0,
      pending: 0.01,
      dragging: false,
      gapMs: 400,
    });

    expect(Math.abs(stalled.velocity)).toBeLessThan(Math.abs(normal.velocity));
  });

  it('a flick released between frames still seeds the coast', () => {
    const out = stepDrag({
      velocity: 0,
      pending: 0.05,
      dragging: false,
      gapMs: FRAME_MS,
    });

    expect(out.velocity).toBeGreaterThan(0);
    expect(out.rotation).toBeGreaterThan(0.05);
  });

  it('comes to rest', () => {
    let velocity = 0.05;
    for (let i = 0; i < 2000; i += 1) {
      velocity = stepDrag({
        velocity,
        pending: 0,
        dragging: false,
        gapMs: FRAME_MS,
      }).velocity;
    }
    expect(velocity).toBe(0);
  });
});
