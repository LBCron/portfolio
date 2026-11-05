import { type OutputNode, text } from '../../output';
import { resolvePath } from '../../vfs';
import { errorText, SECTIONS } from '../helpers';
import { type Command, type CommandContext } from '../types';

export function completePath(ctx: CommandContext, partial: string, dirsOnly = false): string[] {
  const slash = partial.lastIndexOf('/');
  const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : '';
  const prefix = partial.slice(slash + 1);

  return ctx.vfs
    .list(resolvePath(ctx.cwd, dirPart || '.'))
    .filter((entry) => entry.name.startsWith(prefix))
    .filter((entry) => !dirsOnly || entry.type === 'dir')
    .map((entry) => `${dirPart}${entry.name}${entry.type === 'dir' ? '/' : ''}`);
}

const ls: Command = {
  name: 'ls',
  summaryKey: 'terminal.commands.ls.summary',
  usageKey: 'terminal.commands.ls.usage',
  group: 'navigate',
  visibility: 'public',
  needsContent: true,
  complete: (ctx, _args, partial) => completePath(ctx, partial),
  async run(ctx, args) {
    const target = args.positionals[0] ?? '.';
    const path = resolvePath(ctx.cwd, target);
    const kind = ctx.vfs.stat(path);

    if (!kind) {
      return [errorText(ctx.t('terminal.fs.notFound', { command: 'ls', path: target }))];
    }

    if (kind === 'file') return [text(target)];

    const entries = ctx.vfs.list(path);

    if (entries.length === 0) return [text(ctx.t('terminal.fs.empty'), 'dim')];

    return [
      {
        type: 'text',
        spans: entries.flatMap((entry) => [
          entry.type === 'dir'
            ? { text: `${entry.name}/`, tone: 'accent' as const }
            : { text: entry.name },
          { text: '   ' },
        ]),
      },
    ];
  },
};

const cd: Command = {
  name: 'cd',
  summaryKey: 'terminal.commands.cd.summary',
  usageKey: 'terminal.commands.cd.usage',
  group: 'navigate',
  visibility: 'public',
  needsContent: true,
  complete: (ctx, _args, partial) => completePath(ctx, partial, true),
  async run(ctx, args) {
    const target = args.positionals[0] ?? '~';
    const path = resolvePath(ctx.cwd, target);
    const kind = ctx.vfs.stat(path);

    if (!kind) {
      return [errorText(ctx.t('terminal.fs.notFound', { command: 'cd', path: target }))];
    }

    if (kind === 'file') {
      return [errorText(ctx.t('terminal.fs.notDirectory', { command: 'cd', path: target }))];
    }

    ctx.actions.setCwd(path);

    return [];
  },
};

const pwd: Command = {
  name: 'pwd',
  summaryKey: 'terminal.commands.pwd.summary',
  usageKey: 'terminal.commands.pwd.usage',
  group: 'navigate',
  visibility: 'public',
  async run(ctx) {
    return [text(ctx.cwd)];
  },
};

const cat: Command = {
  name: 'cat',
  summaryKey: 'terminal.commands.cat.summary',
  usageKey: 'terminal.commands.cat.usage',
  group: 'navigate',
  visibility: 'public',
  needsContent: true,
  complete: (ctx, _args, partial) => completePath(ctx, partial),
  async run(ctx, args) {
    if (args.positionals.length === 0) {
      return [errorText(ctx.t('terminal.missingOperand', { command: 'cat' }))];
    }

    const output: OutputNode[] = [];
    for (const target of args.positionals) {
      const path = resolvePath(ctx.cwd, target);
      const kind = ctx.vfs.stat(path);
      const file = ctx.vfs.read(path);

      if (!kind) {
        output.push(errorText(ctx.t('terminal.fs.notFound', { command: 'cat', path: target })));
      } else if (kind === 'dir') {
        output.push(errorText(ctx.t('terminal.fs.isDirectory', { command: 'cat', path: target })));
      } else if (file?.binary) {
        output.push(text(ctx.t('terminal.fs.binary', { path: target }), 'warn'));
      } else if (file) {
        output.push({
          type: 'text',
          spans: file.text.split('\n').map((line, index, all) => ({
            text: index < all.length - 1 ? `${line}\n` : line,
            tone: line.startsWith('#') ? ('bold' as const) : ('default' as const),
          })),
        });
      }
    }

    return output;
  },
};

const tree: Command = {
  name: 'tree',
  summaryKey: 'terminal.commands.tree.summary',
  usageKey: 'terminal.commands.tree.usage',
  group: 'navigate',
  visibility: 'public',
  needsContent: true,
  complete: (ctx, _args, partial) => completePath(ctx, partial, true),
  async run(ctx, args) {
    const target = args.positionals[0] ?? '.';
    const path = resolvePath(ctx.cwd, target);
    const kind = ctx.vfs.stat(path);

    if (!kind) {
      return [errorText(ctx.t('terminal.fs.notFound', { command: 'tree', path: target }))];
    }

    if (kind === 'file') {
      return [errorText(ctx.t('terminal.fs.notDirectory', { command: 'tree', path: target }))];
    }

    return [{ type: 'tree', lines: ctx.vfs.tree(path) }];
  },
};

const openCommand: Command = {
  name: 'open',
  summaryKey: 'terminal.commands.open.summary',
  usageKey: 'terminal.commands.open.usage',
  group: 'navigate',
  visibility: 'public',
  needsContent: true,
  complete: (ctx, _args, partial) =>
    [...ctx.content.projects.map((project) => project.slug), ...SECTIONS, 'resume.pdf'].filter(
      (candidate) => candidate.startsWith(partial),
    ),
  async run(ctx, args) {
    const target = args.positionals[0];

    if (!target) {
      return [errorText(ctx.t('terminal.missingOperand', { command: 'open' }))];
    }

    const key = target.toLowerCase();

    if (key === 'resume.pdf' || key === `${ctx.cwd}/resume.pdf`) {
      if (!ctx.content.resume[ctx.locale]) {
        return [text(ctx.t('terminal.resume.unavailable'), 'warn')];
      }

      ctx.actions.downloadResume(ctx.locale);

      return [text(ctx.t('terminal.open.resume'), 'success')];
    }

    if ((SECTIONS as readonly string[]).includes(key)) {
      ctx.actions.scrollToSection(key);

      return [text(ctx.t('terminal.goto.going', { section: key }), 'success')];
    }

    const slug = key.replace(/^(?:~\/)?(?:projects\/)?/, '').replace(/\.md$/, '');
    const project = ctx.content.projects.find((item) => item.slug === slug);

    if (project) {
      ctx.actions.navigate(`/projects/${project.slug}`);

      return [text(ctx.t('terminal.open.project', { title: project.title }), 'success')];
    }

    const link = ctx.content.links.find(
      (item) => item.url.toLowerCase() === key || item.label.toLowerCase() === key,
    );

    if (link && /^https?:/.test(link.url)) {
      ctx.actions.openExternal(link.url);

      return [text(ctx.t('terminal.open.external', { label: link.label }), 'success')];
    }

    return [errorText(ctx.t('terminal.open.unknown', { target }))];
  },
};

const goto: Command = {
  name: 'goto',
  summaryKey: 'terminal.commands.goto.summary',
  usageKey: 'terminal.commands.goto.usage',
  group: 'navigate',
  visibility: 'public',
  complete: (_ctx, _args, partial) => SECTIONS.filter((section) => section.startsWith(partial)),
  async run(ctx, args) {
    const section = args.positionals[0]?.toLowerCase();

    if (!section) {
      return [errorText(ctx.t('terminal.missingOperand', { command: 'goto' }))];
    }

    if (!(SECTIONS as readonly string[]).includes(section)) {
      return [
        errorText(ctx.t('terminal.goto.unknown', { section })),
        text(ctx.t('terminal.goto.available', { list: SECTIONS.join(', ') }), 'dim'),
      ];
    }

    ctx.actions.scrollToSection(section);

    return [text(ctx.t('terminal.goto.going', { section }), 'success')];
  },
};

export const fileCommands: Command[] = [ls, cd, pwd, cat, tree, openCommand, goto];
