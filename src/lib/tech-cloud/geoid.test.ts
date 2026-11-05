import { describe, expect, it } from 'vitest';

import { cloudIconFill, fibonacciGeoid, projectGeoidIcon } from './geoid';

describe('fibonacciGeoid', () => {
  it('returns an empty list for non-positive counts', () => {
    expect(fibonacciGeoid(0)).toEqual([]);
    expect(fibonacciGeoid(-3)).toEqual([]);
  });

  it('spreads points with a deterministic seed', () => {
    let i = 0;
    const random = () => {
      i += 1;

      return (i % 10) / 10;
    };
    const points = fibonacciGeoid(46, random);

    expect(points).toHaveLength(46);
    expect(points[0]?.phi).toBeCloseTo(Math.acos(1 - 1 / 46), 5);
    expect(points.every((point) => point.radiusMultiplier >= 0.8)).toBe(true);
    expect(points.every((point) => point.radiusMultiplier <= 1.2)).toBe(true);

    const thetas = new Set(points.map((point) => point.theta));

    expect(thetas.size).toBe(46);
  });
});

describe('projectGeoidIcon', () => {
  it('marks the back hemisphere as non-interactive', () => {
    const front = projectGeoidIcon({
      phi: Math.PI / 2,
      theta: Math.PI / 2,
      radiusMultiplier: 1,
      floatY: 0,
      width: 560,
      height: 560,
    });
    const back = projectGeoidIcon({
      phi: Math.PI / 2,
      theta: -Math.PI / 2,
      radiusMultiplier: 1,
      floatY: 0,
      width: 560,
      height: 560,
    });

    expect(front.interactive).toBe(true);
    expect(back.interactive).toBe(false);
    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.opacity).toBeGreaterThan(back.opacity);
  });

  it('stretches X with stage width on a rectangular stage', () => {
    const square = projectGeoidIcon({
      phi: Math.PI / 2,
      theta: 0,
      radiusMultiplier: 1,
      floatY: 0,
      width: 400,
      height: 400,
    });
    const wide = projectGeoidIcon({
      phi: Math.PI / 2,
      theta: 0,
      radiusMultiplier: 1,
      floatY: 0,
      width: 800,
      height: 400,
    });

    expect(wide.x).toBeCloseTo(square.x * 2);
    expect(wide.y).toBeCloseTo(square.y);
  });
});

describe('cloudIconFill', () => {
  it('keeps bright brands and lifts near-black marks', () => {
    expect(cloudIconFill('#61dafb')).toBe('#61dafb');
    expect(cloudIconFill('#000000')).toBe('#e8eaf0');
    expect(cloudIconFill('#111111')).toBe('#e8eaf0');
    expect(cloudIconFill(undefined)).toBe('#a3a9b8');
  });
});
