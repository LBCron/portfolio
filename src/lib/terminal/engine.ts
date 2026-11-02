import type { AppLocale } from '@/i18n/routing';

import { usageOf } from './commands/helpers';
import { isSecretName } from './commands/secret/names';
import type {
  Command,
  CommandActions,
  CommandContext,
  SessionInfo,
} from './commands/types';
import { type OutputNode, text } from './output';
import { parseArgs, tokenize, wantsHelp } from './parser';
import { createRegistry, type Registry } from './registry';
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
  /** Reduced motion or Pause animations is on. */
  reducedMotion?: boolean;
  shortcutLabel: string;
  /** The client's view of the admin session (a hint, never authority). */
  session?: SessionInfo | null;
  /** Resolves with the typed secret, or null when cancelled. */
  readSecret?(label: string, signal: AbortSignal): Promise<string | null>;
  /** The lazy secret module; only called for a secret command name. */
  loadSecret?(): Promise<SecretModule>;
  now?(): number;
}

export interface SecretModule {
  commands: Command[];
  expired: OutputNode;
  refreshSession(): Promise<SessionInfo | null>;
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
    auth: {
      isAdmin: Boolean(deps.session),
      ...(deps.session ? { expiresAt: deps.session.expiresAt } : {}),
    },
    actions: deps.actions,
    history: deps.history,
    commands: () => deps.registry.publicCommands(),
    shortcutLabel: deps.shortcutLabel,
    delay: (ms) => deps.delay(ms, signal),
    reducedMotion: deps.reducedMotion ?? false,
    readSecret: (label) =>
      deps.readSecret?.(label, signal) ?? Promise.resolve(null),
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
  const { t } = deps;
  const tokenized = tokenize(line);
  if (!tokenized.ok) {
    yield text(t(`terminal.unsupported.${tokenized.reason}`), 'warn');
    return;
  }
  const [name, ...rest] = tokenized.tokens;
  if (!name) return;

  // A session the clock says is over is confirmed with the server first.
  if (
    deps.session &&
    deps.loadSecret &&
    (deps.now?.() ?? Date.now()) > deps.session.expiresAt
  ) {
    const secret = await deps.loadSecret();
    const fresh = await secret.refreshSession();
    deps.actions.setSession(fresh);
    deps = { ...deps, session: fresh };
    if (!fresh) yield secret.expired;
  }

  let registry = deps.registry;
  if (isSecretName(name) && deps.loadSecret) {
    const secret = await deps.loadSecret();
    registry = createRegistry([
      ...deps.registry.publicCommands(),
      ...secret.commands,
    ]);
  }
  let command = registry.find(name);
  if (command?.requiresSession && !deps.session) command = undefined;
  if (!command) {
    yield text(t('terminal.notFound', { name }), 'error');
    const suggestion = deps.registry.suggest(name);
    if (suggestion) {
      yield text(t('terminal.didYouMean', { suggestion }), 'dim');
      yield { type: 'command', items: [{ command: suggestion }] };
    }
    yield { type: 'command', items: [{ command: 'help' }] };
    return;
  }

  const args = parseArgs(rest, command.valueFlags);
  if (command.visibility === 'public' && wantsHelp(args)) {
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
