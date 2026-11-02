import { createTranslator } from 'next-intl';

import enMessages from '../../../messages/en.json';
import ptMessages from '../../../messages/pt.json';
import type { AppLocale } from '@/i18n/routing';
import { createRepository } from '@/lib/content/create-repository';
import { createFixtureSource } from '@/lib/content/fixtures/source';

import type { Command, CommandActions, SessionInfo } from './commands/types';
import { createRegistry, defaultRegistry } from './registry';
import type { EngineDeps } from './engine';
import { execute } from './engine';
import type { OutputNode } from './output';
import { buildSnapshot, type ContentSnapshot } from './snapshot';
import type { Translate } from './vfs';

const catalogs = { en: enMessages, pt: ptMessages };

/** Throws on any missing key, so a typo in a command fails its test. */
export function translator(locale: AppLocale): Translate {
  const t = createTranslator({
    locale,
    messages: catalogs[locale],
    onError: (error) => {
      throw error;
    },
  });
  return t as unknown as Translate;
}

export async function fixtureSnapshot(
  locale: AppLocale,
): Promise<ContentSnapshot> {
  const repository = createRepository(createFixtureSource(), {
    warn: () => {},
  });
  const [
    profile,
    contact,
    resume,
    links,
    recommended,
    projects,
    experience,
    education,
    technologies,
    practices,
  ] = await Promise.all([
    repository.getProfile(locale),
    repository.getContact(locale),
    repository.getResume(),
    repository.getFeaturedLinks(locale),
    repository.getRecommendedProfiles(locale),
    repository.getProjects(locale),
    repository.getExperience(locale),
    repository.getEducation(locale),
    repository.getTechnologies(locale),
    repository.getPractices(locale),
  ]);
  return buildSnapshot({
    locale,
    profile,
    contact,
    resume,
    links,
    recommended,
    projects,
    experience,
    education,
    technologies,
    practices,
  });
}

export interface Harness {
  deps: EngineDeps;
  calls: string[];
  run(line: string, signal?: AbortSignal): Promise<OutputNode[]>;
}

export async function createHarness(
  locale: AppLocale,
  options: {
    extraCommands?: Command[];
    cwd?: string;
    history?: string[];
    loadContent?: () => Promise<ContentSnapshot>;
    session?: SessionInfo | null;
    readSecret?: EngineDeps['readSecret'];
    loadSecret?: EngineDeps['loadSecret'];
    reducedMotion?: boolean;
  } = {},
): Promise<Harness> {
  const snapshot = await fixtureSnapshot(locale);
  const calls: string[] = [];
  const actions: CommandActions = {
    navigate: (href) => calls.push(`navigate:${href}`),
    scrollToSection: (id) => calls.push(`scroll:${id}`),
    setLocale: (next) => calls.push(`locale:${next}`),
    setCwd: (path) => calls.push(`cwd:${path}`),
    clear: () => calls.push('clear'),
    downloadResume: (next) => calls.push(`download:${next}`),
    openExternal: (url) => calls.push(`external:${url}`),
    goTo: (url) => calls.push(`goto:${url}`),
    setSession: (session) => calls.push(session ? 'session:on' : 'session:off'),
    effect: (effect) => calls.push(`effect:${effect ?? 'off'}`),
    window: {
      close: () => calls.push('close'),
      minimize: () => calls.push('minimize'),
      maximize: () => calls.push('maximize'),
    },
  };
  const registry = options.extraCommands
    ? createRegistry([
        ...defaultRegistry.publicCommands(),
        ...options.extraCommands,
      ])
    : defaultRegistry;
  const deps: EngineDeps = {
    registry,
    locale,
    t: translator(locale),
    cwd: options.cwd ?? '~',
    history: options.history ?? [],
    actions,
    loadContent: options.loadContent ?? (async () => snapshot),
    delay: async (_ms, signal) => {
      if (signal.aborted) throw new Error('aborted');
    },
    shortcutLabel: 'Ctrl /',
    reducedMotion: options.reducedMotion ?? false,
    session: options.session ?? null,
    ...(options.readSecret ? { readSecret: options.readSecret } : {}),
    ...(options.loadSecret ? { loadSecret: options.loadSecret } : {}),
  };
  return {
    deps,
    calls,
    async run(line, signal = new AbortController().signal) {
      const nodes: OutputNode[] = [];
      for await (const node of execute(line, deps, signal)) nodes.push(node);
      return nodes.filter((node) => node.type !== 'spinner');
    },
  };
}

/** Plain text of some output, for assertions. */
export function flatten(nodes: readonly OutputNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.spans.map((span) => span.text).join('');
        case 'link':
          return node.items
            .map((item) => `${item.label} ${item.href}`)
            .join('\n');
        case 'command':
          return node.items.map((item) => item.label ?? item.command).join(' ');
        case 'table':
          return [...(node.head ? [node.head] : []), ...node.rows]
            .map((row) => row.join(' | '))
            .join('\n');
        case 'tree':
          return node.lines.join('\n');
        case 'kv':
          return node.items
            .map((item) => `${item.key}: ${item.value}`)
            .join('\n');
        case 'ascii':
          return node.lines.join('\n');
        case 'spinner':
          return node.label;
        case 'blank':
          return '';
      }
    })
    .join('\n');
}
