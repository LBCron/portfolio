import { parseSaved } from './use-window-sync';

const rect = { x: 1, y: 2, width: 300, height: 200 };

describe('parseSaved', () => {
  it('accepts a well-formed record and drops extra keys', () => {
    expect(
      parseSaved({ status: 'open', maximized: false, rect, extra: 1 }),
    ).toEqual({ status: 'open', maximized: false, rect });
  });

  it.each([
    null,
    'open',
    { status: 'closed', maximized: false, rect },
    { status: 'open', maximized: 'no', rect },
    { status: 'open', maximized: false },
    { status: 'open', maximized: false, rect: { ...rect, x: 'a' } },
    { status: 'open', maximized: false, rect: { ...rect, width: Infinity } },
  ])('rejects %j', (value) => {
    expect(parseSaved(value)).toBeNull();
  });
});
