import { localeTags, routing } from '@/i18n/routing';

import { type OutputNode, text } from '../../output';
import { errorText, usageOf } from '../helpers';
import type { Command, CommandGroup } from '../types';

const GROUPS: CommandGroup[] = ['navigate', 'explore', 'site', 'fun'];

const help: Command = {
  name: 'help',
  aliases: ['man'],
  summaryKey: 'terminal.commands.help.summary',
  usageKey: 'terminal.commands.help.usage',
  group: 'site',
  visibility: 'public',
  complete: (ctx, _args, partial) =>
    ctx
      .commands()
      .map((command) => command.name)
      .filter((name) => name.startsWith(partial)),
  async run(ctx, args) {
    const commands = ctx.commands();
    const requested = args.positionals[0];
    if (requested) {
      const command = commands.find(
        (item) => item.name === requested || item.aliases?.includes(requested),
      );
      return command
        ? usageOf(ctx, command)
        : [errorText(ctx.t('terminal.notFound', { name: requested }))];
    }
    const output: OutputNode[] = [];
    for (const group of GROUPS) {
      const items = commands.filter((command) => command.group === group);
      if (items.length === 0) continue;
      output.push(text(ctx.t(`terminal.groups.${group}`), 'bold'), {
        type: 'kv',
        items: items.map((command) => ({
          key: command.name,
          value: ctx.t(command.summaryKey),
          command: command.name,
        })),
      });
    }
    output.push(
      text(
        ctx.t('terminal.help.footer', { shortcut: ctx.shortcutLabel }),
        'dim',
      ),
    );
    return output;
  },
};

const clear: Command = {
  name: 'clear',
  summaryKey: 'terminal.commands.clear.summary',
  usageKey: 'terminal.commands.clear.usage',
  group: 'site',
  visibility: 'public',
  async run(ctx) {
    ctx.actions.clear();
    return [];
  },
};

const echo: Command = {
  name: 'echo',
  summaryKey: 'terminal.commands.echo.summary',
  usageKey: 'terminal.commands.echo.usage',
  group: 'fun',
  visibility: 'public',
  async run(_ctx, args) {
    return [text(args.raw.join(' '))];
  },
};

const history: Command = {
  name: 'history',
  summaryKey: 'terminal.commands.history.summary',
  usageKey: 'terminal.commands.history.usage',
  group: 'site',
  visibility: 'public',
  async run(ctx) {
    if (ctx.history.length === 0) {
      return [text(ctx.t('terminal.history.empty'), 'dim')];
    }
    const width = String(ctx.history.length).length;
    return [
      text(
        ctx.history
          .map((line, index) => `${String(index + 1).padStart(width)}  ${line}`)
          .join('\n'),
      ),
    ];
  },
};

const date: Command = {
  name: 'date',
  summaryKey: 'terminal.commands.date.summary',
  usageKey: 'terminal.commands.date.usage',
  group: 'fun',
  visibility: 'public',
  async run(ctx) {
    return [
      text(
        new Intl.DateTimeFormat(localeTags[ctx.locale], {
          dateStyle: 'full',
          timeStyle: 'medium',
        }).format(new Date()),
      ),
    ];
  },
};

const uname: Command = {
  name: 'uname',
  summaryKey: 'terminal.commands.uname.summary',
  usageKey: 'terminal.commands.uname.usage',
  group: 'fun',
  visibility: 'public',
  async run(_ctx, args) {
    return [
      text(
        args.flags['a'] || args.flags['all']
          ? 'Folio julio-muller 1.0 #1 web x86_64 portfolio'
          : 'Folio',
      ),
    ];
  },
};

const whoami: Command = {
  name: 'whoami',
  summaryKey: 'terminal.commands.whoami.summary',
  usageKey: 'terminal.commands.whoami.usage',
  group: 'explore',
  visibility: 'public',
  async run(ctx) {
    return [text(ctx.auth.isAdmin ? 'julio' : 'visitor')];
  },
};

const lang: Command = {
  name: 'lang',
  summaryKey: 'terminal.commands.lang.summary',
  usageKey: 'terminal.commands.lang.usage',
  group: 'site',
  visibility: 'public',
  complete: (_ctx, _args, partial) =>
    routing.locales.filter((locale) => locale.startsWith(partial)),
  async *run(ctx, args) {
    const target = args.positionals[0]?.toLowerCase();
    const name = (locale: string) => ctx.t(`header.languageNames.${locale}`);
    if (!target) {
      yield text(
        ctx.t('terminal.lang.current', { language: name(ctx.locale) }),
      );
      yield text(
        ctx.t('terminal.lang.available', { list: routing.locales.join(', ') }),
        'dim',
      );
      return;
    }
    const locale = routing.locales.find((item) => item === target);
    if (!locale) {
      yield errorText(ctx.t('terminal.lang.unknown', { language: target }));
      return;
    }
    if (locale === ctx.locale) {
      yield text(
        ctx.t('terminal.lang.already', { language: name(locale) }),
        'warn',
      );
      return;
    }
    yield text(
      ctx.t('terminal.lang.switched', { language: name(locale) }),
      'success',
    );
    // Runs after the consumer stored the confirmation, so it survives the reload.
    ctx.actions.setLocale(locale);
  },
};

const exit: Command = {
  name: 'exit',
  summaryKey: 'terminal.commands.exit.summary',
  usageKey: 'terminal.commands.exit.usage',
  group: 'site',
  visibility: 'public',
  async run(ctx) {
    ctx.actions.window.close();
    return [];
  },
};

const minimize: Command = {
  name: 'minimize',
  summaryKey: 'terminal.commands.minimize.summary',
  usageKey: 'terminal.commands.minimize.usage',
  group: 'site',
  visibility: 'public',
  async run(ctx) {
    ctx.actions.window.minimize();
    return [];
  },
};

const maximize: Command = {
  name: 'maximize',
  summaryKey: 'terminal.commands.maximize.summary',
  usageKey: 'terminal.commands.maximize.usage',
  group: 'site',
  visibility: 'public',
  async run(ctx) {
    ctx.actions.window.maximize();
    return [];
  },
};

export const systemCommands: Command[] = [
  help,
  clear,
  echo,
  history,
  date,
  uname,
  whoami,
  lang,
  exit,
  minimize,
  maximize,
];
