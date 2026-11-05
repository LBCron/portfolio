import { fitFontSize } from './fit-text';

describe('fitFontSize', () => {
  it('shrinks text that overflows', () => {
    expect(fitFontSize({ available: 300, contentWidth: 600, fontSize: 80, max: 80 })).toBe(40);
  });

  it('caps growth at max when there is room', () => {
    expect(fitFontSize({ available: 900, contentWidth: 300, fontSize: 40, max: 80 })).toBe(80);
  });

  it('scales up to fill the room below max', () => {
    expect(fitFontSize({ available: 450, contentWidth: 300, fontSize: 40, max: 80 })).toBe(60);
  });

  it('floors to half pixels and ignores unmeasured text', () => {
    expect(fitFontSize({ available: 333, contentWidth: 400, fontSize: 53, max: 80 })).toBe(44);
    expect(fitFontSize({ available: 0, contentWidth: 0, fontSize: 53, max: 80 })).toBe(53);
  });
});
