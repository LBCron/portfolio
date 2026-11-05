import { localeTags } from '@/i18n/routing';

import { type OutputNode, text } from '../../output';
import { errorText, lines } from '../helpers';
import { type Command } from '../types';

/**
 * Harmless easter eggs (§10.4). None of them runs anything, touches the network
 * or says a word about the admin: `sudo` never grants, `rm` never removes,
 * `ping` and `ssh` stay on this page.
 */

const HOME_HOST = 'julio-muller';
/**
 * Hosts `ping` answers for; anything else would need a network.
 */
const LOCAL_HOSTS = new Set(['127.0.0.1', HOME_HOST, 'localhost']);
const PING_COUNT = 4;
const PING_INTERVAL_MS = 250;
export const MATRIX_MS = 4000;
const COW_WIDTH = 36;
const COW_MAX_INPUT = 280;

/**
 * Keys of `terminal.fortune.items`; the maxims are original, not quotes.
 */
export const FORTUNES = [
  'names',
  'deleted',
  'cache',
  'estimate',
  'logs',
  'rollback',
  'boring',
  'a11y',
  'abstraction',
  'tests',
  'profile',
  'dependency',
] as const;

const COW = [
  '        \\   ^__^',
  '         \\  (oo)\\_______',
  '            (__)\\       )\\/\\',
  '                ||----w |',
  '                ||     ||',
];

/**
 * Greedy word wrap by code points; words longer than `width` are split.
 */
export function wrapWords(input: string, width: number): string[] {
  const out: string[] = [];
  let line: string[] = [];
  const flush = () => {
    out.push(line.join(''));
    line = [];
  };
  for (const word of input.split(/\s+/).filter(Boolean)) {
    let chars = [...word];

    while (chars.length > 0) {
      const room = width - line.length - (line.length > 0 ? 1 : 0);

      if (chars.length <= room) {
        if (line.length > 0) line.push(' ');

        line.push(...chars);
        chars = [];
      } else if (line.length > 0) {
        flush();
      } else {
        line.push(...chars.slice(0, width));
        chars = chars.slice(width);
        flush();
      }
    }
  }

  if (line.length > 0 || out.length === 0) flush();

  return out;
}

/**
 * The classic cow with a speech bubble around `message`.
 */
export function cowsay(message: string, width = COW_WIDTH): string[] {
  const rows = wrapWords(message, width);
  const size = Math.max(...rows.map((row) => [...row].length));
  const pad = (row: string) => row + ' '.repeat(size - [...row].length);
  const bubble =
    rows.length === 1
      ? [`< ${pad(rows[0] ?? '')} >`]
      : rows.map((row, index) => {
          const [open, close] =
            index === 0 ? ['/', '\\'] : index === rows.length - 1 ? ['\\', '/'] : ['|', '|'];

          return `${open} ${pad(row)} ${close}`;
        });

  return [` ${'_'.repeat(size + 2)}`, ...bubble, ` ${'-'.repeat(size + 2)}`, ...COW];
}

const sudo: Command = {
  name: 'sudo',
  summaryKey: 'terminal.commands.sudo.summary',
  usageKey: 'terminal.commands.sudo.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx) {
    return [
      lines(
        { text: ctx.t('terminal.fun.sudo.denied'), tone: 'error' },
        { text: ctx.t('terminal.fun.sudo.joke'), tone: 'dim' },
      ),
    ];
  },
};

const ROOTS = new Set(['.', '..', '/', '/*', '~', '~/']);

const rm: Command = {
  name: 'rm',
  summaryKey: 'terminal.commands.rm.summary',
  usageKey: 'terminal.commands.rm.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx, args) {
    const target = args.positionals[0];

    if (!target) {
      return [errorText(ctx.t('terminal.missingOperand', { command: 'rm' }))];
    }

    const recursive = Boolean(args.flags['r'] || args.flags['R'] || args.flags['recursive']);

    if (recursive && args.positionals.some((path) => ROOTS.has(path))) {
      return [
        lines(
          { text: ctx.t('terminal.fun.rm.refuse'), tone: 'warn' },
          { text: ctx.t('terminal.fun.rm.joke'), tone: 'dim' },
        ),
      ];
    }

    return [errorText(ctx.t('terminal.fun.rm.readOnly', { path: target }))];
  },
};

const editor: Command = {
  name: 'vim',
  aliases: ['vi', 'nano', 'emacs'],
  summaryKey: 'terminal.commands.vim.summary',
  usageKey: 'terminal.commands.vim.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx) {
    return [text(ctx.t('terminal.fun.editor'))];
  },
};

const ping: Command = {
  name: 'ping',
  summaryKey: 'terminal.commands.ping.summary',
  usageKey: 'terminal.commands.ping.usage',
  group: 'fun',
  visibility: 'public',
  async *run(ctx, args) {
    const host = args.positionals[0] ?? HOME_HOST;

    if (!LOCAL_HOSTS.has(host.toLowerCase())) {
      yield errorText(ctx.t('terminal.fun.ping.offline', { host }));
      yield { type: 'command', items: [{ command: 'contact' }] };

      return;
    }

    const format = new Intl.NumberFormat(localeTags[ctx.locale], {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

    yield text(ctx.t('terminal.fun.ping.header', { host }));
    for (let seq = 1; seq <= PING_COUNT; seq += 1) {
      await ctx.delay(PING_INTERVAL_MS);

      // A steady, made-up round trip: there is no network to measure.
      const time = format.format(0.04 + ((seq * 7) % 5) / 1000);

      yield text(ctx.t('terminal.fun.ping.reply', { host, seq, time }), 'dim');
    }
    yield text(ctx.t('terminal.fun.ping.summary', { count: PING_COUNT }), 'success');
  },
};

const ssh: Command = {
  name: 'ssh',
  summaryKey: 'terminal.commands.ssh.summary',
  usageKey: 'terminal.commands.ssh.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx, args) {
    const target = args.positionals[0] ?? HOME_HOST;
    const host = target.includes('@') ? target.split('@').pop() || target : target;

    return [
      lines(
        { text: ctx.t('terminal.fun.ssh.refused', { host }), tone: 'error' },
        { text: ctx.t('terminal.fun.ssh.joke'), tone: 'dim' },
      ),
    ];
  },
};

const matrix: Command = {
  name: 'matrix',
  summaryKey: 'terminal.commands.matrix.summary',
  usageKey: 'terminal.commands.matrix.usage',
  group: 'fun',
  visibility: 'public',
  async *run(ctx) {
    if (ctx.reducedMotion) {
      yield text(ctx.t('terminal.fun.matrix.reduced'), 'dim');

      return;
    }

    ctx.actions.effect('matrix');

    try {
      await ctx.delay(MATRIX_MS);
    } finally {
      ctx.actions.effect(null);
    }

    yield text(ctx.t('terminal.fun.matrix.done'), 'success');
  },
};

const cowsayCommand: Command = {
  name: 'cowsay',
  summaryKey: 'terminal.commands.cowsay.summary',
  usageKey: 'terminal.commands.cowsay.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx, args) {
    const said =
      [...args.raw.join(' ').trim()].slice(0, COW_MAX_INPUT).join('')
      || ctx.t('terminal.fun.cowsay.default');
    const node: OutputNode = {
      type: 'ascii',
      lines: cowsay(said),
      label: ctx.t('terminal.fun.cowsay.label', { message: said }),
    };

    return [node];
  },
};

const fortune: Command = {
  name: 'fortune',
  summaryKey: 'terminal.commands.fortune.summary',
  usageKey: 'terminal.commands.fortune.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx) {
    const key = FORTUNES[Math.floor(Math.random() * FORTUNES.length)] ?? FORTUNES[0];

    return [text(ctx.t(`terminal.fortune.items.${key}`), 'accent')];
  },
};

export const funCommands: Command[] = [fortune, cowsayCommand, matrix, ping, ssh, sudo, rm, editor];
