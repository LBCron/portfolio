import { describe, expect, it } from 'vitest';

import { plainText, truncate } from './text';

describe('plainText', () => {
  it('strips real Markdown markers', () => {
    expect(
      plainText(
        '# Title\n> quote with **bold**, *em*, __strong__, _em_, ~~gone~~ and `code`\n[link](http://x) ![img](a.png)',
      ),
    ).toBe('Title quote with bold, em, strong, em, gone and code link');
  });

  it('keeps literal #, _, ~ and * in ordinary text', () => {
    const text = 'C# interop for snake_case_names and ~/dotfiles, 2 * 3 = 6';

    expect(plainText(text)).toBe(text);
    expect(truncate(text, 100)).toBe(text);
  });
});
