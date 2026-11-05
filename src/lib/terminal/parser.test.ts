import { describe, expect, it } from 'vitest';

import { parseArgs, tokenize, wantsHelp } from './parser';

const tokens = (input: string) => {
  const result = tokenize(input);

  if (!result.ok) throw new Error(result.reason);

  return result.tokens;
};

describe('tokenize', () => {
  it('splits on whitespace and ignores empty input', () => {
    expect(tokens('  projects   --kind web ')).toEqual(['projects', '--kind', 'web']);
    expect(tokens('')).toEqual([]);
    expect(tokens('   ')).toEqual([]);
  });

  it('keeps quoted text together and allows empty arguments', () => {
    expect(tokens(`echo "hello   world" 'it is'`)).toEqual(['echo', 'hello   world', 'it is']);
    expect(tokens('echo ""')).toEqual(['echo', '']);
    expect(tokens(`echo a"b c"d`)).toEqual(['echo', 'ab cd']);
  });

  it('handles backslash escapes', () => {
    expect(tokens('echo a\\ b')).toEqual(['echo', 'a b']);
    expect(tokens('echo "say \\"hi\\""')).toEqual(['echo', 'say "hi"']);
    expect(tokens('echo "a\\nb"')).toEqual(['echo', 'a\\nb']);
    expect(tokens(`echo 'a\\b'`)).toEqual(['echo', 'a\\b']);
    expect(tokens('echo a\\')).toEqual(['echo', 'a\\']);
  });

  it('allows operators inside quotes', () => {
    expect(tokens(`echo "a; b | c > d" '$HOME *'`)).toEqual(['echo', 'a; b | c > d', '$HOME *']);
  });

  it.each([
    ['ls; pwd', 'chain'],
    ['ls && pwd', 'chain'],
    ['ls | cat', 'pipe'],
    ['ls > out', 'redirect'],
    ['cat < in', 'redirect'],
    ['ls *.md', 'glob'],
    ['ls a?', 'glob'],
    ['echo $HOME', 'variable'],
    ['echo "$HOME"', 'variable'],
    ['echo "unclosed', 'unterminated'],
  ] as const)('reports %s as %s', (input, reason) => {
    expect(tokenize(input)).toEqual({ ok: false, reason });
  });
});

describe('parseArgs', () => {
  it('separates positionals and flags', () => {
    expect(parseArgs(['--featured', 'open', 'x'], ['kind'])).toEqual({
      positionals: ['open', 'x'],
      flags: { featured: true },
      raw: ['--featured', 'open', 'x'],
    });
  });

  it('reads values for declared flags, with = or a space', () => {
    expect(parseArgs(['--kind', 'web'], ['kind']).flags).toEqual({
      kind: 'web',
    });
    expect(parseArgs(['--kind=web']).flags).toEqual({ kind: 'web' });
    expect(parseArgs(['--kind'], ['kind']).flags).toEqual({ kind: true });
  });

  it('expands short clusters and stops at --', () => {
    expect(parseArgs(['-la', '--', '--x']).flags).toEqual({ l: true, a: true });
    expect(parseArgs(['-a', '--', '--x']).positionals).toEqual(['--x']);
  });

  it('detects help flags', () => {
    expect(wantsHelp(parseArgs(['--help']))).toBe(true);
    expect(wantsHelp(parseArgs(['-h']))).toBe(true);
    expect(wantsHelp(parseArgs(['x']))).toBe(false);
  });
});
