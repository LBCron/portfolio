import type { AppLocale } from '@/i18n/routing';

import type { OutputNode } from '../output';
import type { ParsedArgs } from '../parser';
import type { ContentSnapshot } from '../snapshot';
import type { Translate, VirtualFS } from '../vfs';

export type { ParsedArgs };

export type CommandGroup = 'navigate' | 'explore' | 'site' | 'fun';

/** A live admin session as the server reported it. */
export interface SessionInfo {
  expiresAt: number;
  base: string;
}

export interface CommandActions {
  /** Internal path without a locale prefix, e.g. `/projects/x`. */
  navigate(href: string): void;
  scrollToSection(id: string): void;
  setLocale(locale: AppLocale): void;
  setCwd(path: string): void;
  clear(): void;
  downloadResume(locale: AppLocale): void;
  openExternal(url: string): void;
  /** Full page load, for leaving the public site (the admin is another app). */
  goTo(url: string): void;
  setSession(session: SessionInfo | null): void;
  window: { close(): void; minimize(): void; maximize(): void };
}

export interface CommandContext {
  locale: AppLocale;
  cwd: string;
  t: Translate;
  vfs: VirtualFS;
  content: ContentSnapshot;
  /** Mirrors the server session; a UI hint, never used to authorize. */
  auth: { isAdmin: boolean; expiresAt?: number };
  actions: CommandActions;
  history: readonly string[];
  /** Public commands only. */
  commands: () => readonly Command[];
  /** Label of the terminal shortcut for the visitor's platform. */
  shortcutLabel: string;
  /** Abortable pause; resolves immediately with reduced motion. */
  delay(ms: number): Promise<void>;
  /** Secret-input mode: resolves with the typed value, or null on Ctrl+C. */
  readSecret(label: string): Promise<string | null>;
}

export interface Command {
  name: string;
  aliases?: string[];
  /** Message keys, e.g. `terminal.commands.help.summary`. */
  summaryKey: string;
  usageKey: string;
  group: CommandGroup;
  visibility: 'public' | 'secret';
  /** Unknown-command behavior unless an admin session exists. */
  requiresSession?: boolean;
  /** Flags that consume the next token as their value. */
  valueFlags?: string[];
  /** Waits for the content snapshot (and builds the file system) first. */
  needsContent?: boolean;
  complete?(ctx: CommandContext, args: string[], partial: string): string[];
  run(
    ctx: CommandContext,
    args: ParsedArgs,
    signal: AbortSignal,
  ): Promise<OutputNode[]> | AsyncGenerator<OutputNode>;
}
