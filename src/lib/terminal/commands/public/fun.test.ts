import { describe, expect, it } from 'vitest';

import { type AppLocale } from '@/i18n/routing';

import { createHarness, flatten } from '../../test-utils';
import { cowsay, FORTUNES, wrapWords } from './fun';

const LOCALES: AppLocale[] = ['en', 'pt'];
const EGGS = [
  'sudo rm -rf /',
  'rm -rf /',
  'rm notes.md',
  'vim',
  'nano about.md',
  'emacs',
  'ping',
  'ping example.com',
  'ssh julio@julio-muller',
  'matrix',
  'cowsay hello',
  'fortune',
];

describe('wrapWords and cowsay', () => {
  it('wraps on words and splits words longer than the width', () => {
    expect(wrapWords('make it work make it clear', 10)).toEqual([
      'make it',
      'work make',
      'it clear',
    ]);
    expect(wrapWords('abcdefghijkl', 5)).toEqual(['abcde', 'fghij', 'kl']);
    expect(wrapWords('', 5)).toEqual(['']);
  });

  it('draws a one-line bubble with angle brackets', () => {
    const art = cowsay('moo');

    expect(art.slice(0, 3)).toEqual([' _____', '< moo >', ' -----']);
    expect(art.at(-1)).toContain('||     ||');
  });

  it('draws a multi-line bubble with aligned edges', () => {
    const art = cowsay('one two three four', 8);

    expect(art.slice(1, 4)).toEqual(['/ one two \\', '| three   |', '\\ four    /']);

    const widths = new Set(art.slice(1, 4).map((line) => line.length));

    expect(widths.size).toBe(1);
  });

  it('pads by code points, so accents keep the bubble square', () => {
    const art = cowsay('ação é', 4);

    expect(art.slice(1, 3)).toEqual(['/ ação \\', '\\ é    /']);
  });
});

describe.each(LOCALES)('easter eggs (%s)', (locale) => {
  it('sudo never runs the command and never grants anything', async () => {
    const harness = await createHarness(locale);
    const output = flatten(await harness.run('sudo rm -rf /'));

    expect(output).toContain('sudoers');
    expect(harness.calls).toEqual([]);
    expect(flatten(await harness.run('sudo'))).toBe(output);
  });

  it('rm refuses the root, and everything else is read-only', async () => {
    const harness = await createHarness(locale);
    const root = flatten(await harness.run('rm -rf /'));

    expect(flatten(await harness.run('rm -fr ~'))).toBe(root);

    const file = flatten(await harness.run('rm about.md'));

    expect(file).toContain('about.md');
    expect(file).not.toBe(root);
    expect(flatten(await harness.run('rm'))).toContain('rm');
    expect(harness.calls).toEqual([]);
  });

  it('every editor gets the same one-liner', async () => {
    const harness = await createHarness(locale);
    const vim = flatten(await harness.run('vim'));
    for (const name of ['vi', 'nano', 'emacs about.md']) {
      expect(flatten(await harness.run(name))).toBe(vim);
    }
  });

  it('ping answers four times for this site and refuses other hosts', async () => {
    const harness = await createHarness(locale);
    const local = await harness.run('ping');

    expect(local).toHaveLength(6);
    expect(flatten(local)).toContain('julio-muller');
    expect(flatten(local)).toMatch(/icmp_seq=4/);
    expect(flatten(local)).toMatch(locale === 'pt' ? /0,04\d/ : /0\.04\d/);

    const remote = await harness.run('ping example.com');

    expect(flatten(remote)).toContain('example.com');
    expect(remote.at(-1)).toEqual({
      type: 'command',
      items: [{ command: 'contact' }],
    });
  });

  it('ping stops on Ctrl+C', async () => {
    const harness = await createHarness(locale);
    const controller = new AbortController();
    const { execute } = await import('../../engine');
    let lines = 0;
    for await (const node of execute('ping', harness.deps, controller.signal)) {
      if (node.type === 'text') lines += 1;

      if (lines === 2) controller.abort();
    }
    expect(lines).toBe(2);
  });

  it('ssh is refused for the host after the @', async () => {
    const harness = await createHarness(locale);
    const output = flatten(await harness.run('ssh root@example.com'));

    expect(output).toContain('example.com');
    expect(output).not.toContain('root@');
  });

  it('matrix plays the effect and always switches it off', async () => {
    const harness = await createHarness(locale);
    const output = await harness.run('matrix');

    expect(harness.calls).toEqual(['effect:matrix', 'effect:off']);
    expect(output).toHaveLength(1);

    const aborted = await createHarness(locale);
    const controller = new AbortController();

    controller.abort();
    expect(await aborted.run('matrix', controller.signal)).toEqual([]);
    expect(aborted.calls).toEqual(['effect:matrix', 'effect:off']);
  });

  it('matrix is skipped with reduced motion', async () => {
    const harness = await createHarness(locale, { reducedMotion: true });
    const output = await harness.run('matrix');

    expect(harness.calls).toEqual([]);
    expect(output).toHaveLength(1);
    expect(output[0]).toMatchObject({ type: 'text' });
  });

  it('cowsay speaks the text, or a default, as labelled art', async () => {
    const harness = await createHarness(locale);
    const [node] = await harness.run('cowsay "make it kind"');

    expect(node).toMatchObject({ type: 'ascii' });

    if (node?.type !== 'ascii') throw new Error('expected ascii');

    expect(node.lines[1]).toBe('< make it kind >');
    expect(node.label).toContain('make it kind');

    const [fallback] = await harness.run('cowsay');

    expect(fallback?.type === 'ascii' && fallback.label).toBeTruthy();
  });

  it('fortune prints one of the localized maxims', async () => {
    const harness = await createHarness(locale);
    const all = FORTUNES.map((key) => harness.deps.t(`terminal.fortune.items.${key}`));

    expect(new Set(all).size).toBe(FORTUNES.length);
    for (let index = 0; index < 5; index += 1) {
      expect(all).toContain(flatten(await harness.run('fortune')));
    }
  });

  it('no easter egg mentions the admin or the secret commands', async () => {
    const harness = await createHarness(locale);
    for (const line of EGGS) {
      const output = flatten(await harness.run(line)).toLowerCase();

      expect(output, line).not.toMatch(/admin|\bsu\b|logout|password|senha/);
    }
  });
});
