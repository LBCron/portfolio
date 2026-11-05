import { exploreCommands } from './commands/public/explore';
import { fileCommands } from './commands/public/files';
import { funCommands } from './commands/public/fun';
import { systemCommands } from './commands/public/system';
import { isSecretName } from './commands/secret/names';
import { type Command } from './commands/types';
import { tokenize } from './parser';
import { didYouMean } from './suggest';

export interface Registry {
  find(name: string): Command | undefined;
  /**
   * True for secret commands: never recorded, completed or suggested.
   */
  isSecret(name: string): boolean;
  /**
   * Public commands, in help order.
   */
  publicCommands(): readonly Command[];
  suggest(name: string): null | string;
}

/**
 * Secret commands (Phase 7) are passed in only after their lazy module loads;
 * they stay out of every public listing, completion and suggestion.
 */
export function createRegistry(commands: readonly Command[]): Registry {
  const byName = new Map<string, Command>();
  for (const command of commands) {
    byName.set(command.name, command);
    for (const alias of command.aliases ?? []) byName.set(alias, command);
  }
  const visible = commands.filter((command) => command.visibility === 'public');
  const visibleNames = visible.flatMap((command) => [command.name, ...(command.aliases ?? [])]);

  return {
    publicCommands: () => visible,
    find: (name) => byName.get(name),
    isSecret: (name) => byName.get(name)?.visibility === 'secret',
    suggest: (name) => didYouMean(name, visibleNames),
  };
}

/**
 * Checks the raw first word and the one the engine will actually run, so
 * `"su"`, `s''u` or `\admin` cannot dodge the secrecy rules.
 */
export function isSecretLine(registry: Registry, line: string) {
  const raw = line.trim().split(/\s+/)[0] ?? '';
  const tokens = tokenize(line);
  const parsed = tokens.ok ? tokens.tokens[0] : undefined;

  return [raw, parsed].some((name) => isSecretName(name) || (!!name && registry.isSecret(name)));
}

/**
 * Secret commands are never recorded in history (nor persisted anywhere).
 */
export function isRecordable(registry: Registry, line: string) {
  return line.trim() !== '' && !isSecretLine(registry, line);
}

export const publicCommands: readonly Command[] = [
  ...fileCommands,
  ...exploreCommands,
  ...systemCommands,
  ...funCommands,
];

export const defaultRegistry = createRegistry(publicCommands);
