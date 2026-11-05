import { type AppLocale } from '@/i18n/routing';

import { type OutputNode } from '../output';
import { type ParsedArgs } from '../parser';
import { type ContentSnapshot } from '../snapshot';
import { type Translate, type VirtualFS } from '../vfs';

export type { ParsedArgs };

export type CommandGroup = 'explore' | 'fun' | 'navigate' | 'site';

/**
 * Short visual effects the terminal UI can play over its body.
 */
export type TerminalEffect = 'matrix';

/**
 * A live admin session as the server reported it.
 */
export interface SessionInfo {
  base: string;
  expiresAt: number;
}

export interface CommandActions {
  clear(): void;
  downloadResume(locale: AppLocale): void;
  /**
   * Starts (or, with null, stops) a visual effect over the terminal body.
   */
  effect(effect: null | TerminalEffect): void;
  /**
   * Full page load, for leaving the public site (the admin is another app).
   */
  goTo(url: string): void;
  /**
   * Internal path without a locale prefix, e.g. `/projects/x`.
   */
  navigate(href: string): void;
  openExternal(url: string): void;
  scrollToSection(id: string): void;
  setCwd(path: string): void;
  setLocale(locale: AppLocale): void;
  setSession(session: null | SessionInfo): void;
  window: { close(): void; maximize(): void; minimize(): void };
}

export interface CommandContext {
  actions: CommandActions;
  /**
   * Mirrors the server session; a UI hint, never used to authorize.
   */
  auth: { expiresAt?: number; isAdmin: boolean };
  /**
   * Public commands only.
   */
  commands: () => readonly Command[];
  content: ContentSnapshot;
  cwd: string;
  /**
   * Abortable pause; resolves immediately with reduced motion.
   */
  delay(ms: number): Promise<void>;
  history: readonly string[];
  locale: AppLocale;
  /**
   * Secret-input mode: resolves with the typed value, or null on Ctrl+C.
   */
  readSecret(label: string): Promise<null | string>;
  /**
   * Reduced motion or Pause animations: skip anything animated.
   */
  reducedMotion: boolean;
  /**
   * Label of the terminal shortcut for the visitor's platform.
   */
  shortcutLabel: string;
  t: Translate;
  vfs: VirtualFS;
}

export interface Command {
  aliases?: string[];
  complete?(ctx: CommandContext, args: string[], partial: string): string[];
  group: CommandGroup;
  name: string;
  /**
   * Waits for the content snapshot (and builds the file system) first.
   */
  needsContent?: boolean;
  /**
   * Unknown-command behavior unless an admin session exists.
   */
  requiresSession?: boolean;
  run(
    ctx: CommandContext,
    args: ParsedArgs,
    signal: AbortSignal,
  ): AsyncGenerator<OutputNode> | Promise<OutputNode[]>;
  /**
   * Message keys, e.g. `terminal.commands.help.summary`.
   */
  summaryKey: string;
  usageKey: string;
  /**
   * Flags that consume the next token as their value.
   */
  valueFlags?: string[];
  visibility: 'public' | 'secret';
}
