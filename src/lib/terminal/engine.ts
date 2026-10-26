import type { AppLocale } from '@/i18n/routing';

import { usageOf } from './commands/helpers';
import type { CommandActions, CommandContext } from './commands/types';
import { type OutputNode, text } from './output';
import { parseArgs, tokenize, wantsHelp } from './parser';
import type { Registry } from './registry';
import { type ContentSnapshot, emptySnapshot } from './snapshot';
import { buildVfs, type Translate } from './vfs';

export interface EngineDeps {
  registry: Registry;
  locale: AppLocale;
  t: Translate;
  cwd: string;
  history: readonly string[];
  actions: CommandActions;
  loadContent(): Promise<ContentSnapshot>;
  /** Pause for `ms`; resolves at once with reduced motion, rejects on abort. */
  delay(ms: number, signal: AbortSignal): Promise<void>;
  shortcutLabel: string;
  isAdmin?: boolean;
}

export function buildContext(
  deps: EngineDeps,
  content: ContentSnapshot,
  signal: AbortSignal,
): CommandContext {
  return {
    locale: deps.locale,
    cwd: deps.cwd,
    t: deps.t,
    vfs: buildVfs(content, deps.t),
    content,
    auth: { isAdmin: deps.isAdmin ?? false },
    actions: deps.actions,
    history: deps.history,
    commands: () => deps.registry.publicCommands(),
    shortcutLabel: deps.shortcutLabel,
    delay: (ms) => deps.delay(ms, signal),
  };
}

/**
 * Runs one input line and streams its output. Unknown commands, unsupported
 * shell syntax and failed loads all come back as output, never as throws.
 */
export async function* execute(
  line: string,
  deps: EngineDeps,
  signal: AbortSignal,
): AsyncGenerator<OutputNode> {
  const { t, registry } = deps;
  const tokenized = tokenize(line);
  if (!tokenized.ok) {
    yield text(t(`terminal.unsupported.${tokenized.reason}`), 'warn');
    return;
  }
  const [name, ...rest] = tokenized.tokens;
  if (!name) return;

  const command = registry.find(name);
  if (!command) {
    yield text(t('terminal.notFound', { name }), 'error');
    const suggestion = registry.suggest(name);
    if (suggestion) {
      yield text(t('terminal.didYouMean', { suggestion }), 'dim');
      yield { type: 'command', items: [{ command: suggestion }] };
    }
    yield { type: 'command', items: [{ command: 'help' }] };
    return;
  }

  const args = parseArgs(rest, command.valueFlags);
  if (wantsHelp(args)) {
    yield* usageOf(
      buildContext(deps, emptySnapshot(deps.locale), signal),
      command,
    );
    return;
  }

  let content = emptySnapshot(deps.locale);
  if (command.needsContent) {
    yield { type: 'spinner', label: t('terminal.loading') };
    try {
      content = await deps.loadContent();
    } catch {
      yield text(t('terminal.loadFailed'), 'error');
      return;
    }
  }

  try {
    const result = command.run(
      buildContext(deps, content, signal),
      args,
      signal,
    );
    const nodes = Symbol.asyncIterator in result ? result : await result;
    for await (const node of nodes) {
      if (signal.aborted) return;
      yield node;
    }
  } catch (error) {
    // An aborted delay rejects; that is the normal way out, not a failure.
    if (!signal.aborted) throw error;
  }
}
