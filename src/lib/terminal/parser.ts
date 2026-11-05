export type UnsupportedReason =
  'chain' | 'glob' | 'pipe' | 'redirect' | 'unterminated' | 'variable';

export type TokenizeResult =
  { ok: false; reason: UnsupportedReason } | { ok: true; tokens: string[] };

export interface ParsedArgs {
  flags: Record<string, string | true>;
  positionals: string[];
  /**
   * The untouched tokens after the command name (for `echo`).
   */
  raw: string[];
}

const UNSUPPORTED: Record<string, UnsupportedReason> = {
  ';': 'chain',
  '&': 'chain',
  '|': 'pipe',
  '>': 'redirect',
  '<': 'redirect',
  '*': 'glob',
  '?': 'glob',
  '$': 'variable',
  '`': 'variable',
};

/**
 * Whitespace tokenizer with single quotes, double quotes and backslash escapes.
 * Shell operators are reported, never interpreted.
 */
export function tokenize(input: string): TokenizeResult {
  const tokens: string[] = [];
  let current = '';
  let inToken = false;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] as string;

    if (quote === "'") {
      if (char === "'") quote = null;
      else current += char;

      continue;
    }

    if (char === '\\') {
      const next = input[index + 1];
      inToken = true;

      if (next === undefined) current += char;
      else if (quote === '"' && !'"\\$`'.includes(next)) current += char;
      else {
        current += next;
        index += 1;
      }

      continue;
    }

    if (quote === '"') {
      if (char === '"') quote = null;
      else if (char === '$' || char === '`') {
        return { ok: false, reason: 'variable' };
      } else current += char;

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      inToken = true;
      continue;
    }

    if (/\s/.test(char)) {
      if (inToken) tokens.push(current);

      current = '';
      inToken = false;
      continue;
    }

    const reason = UNSUPPORTED[char];

    if (reason) return { ok: false, reason };

    current += char;
    inToken = true;
  }

  if (quote) return { ok: false, reason: 'unterminated' };

  if (inToken) tokens.push(current);

  return { ok: true, tokens };
}

/**
 * Splits tokens into positionals and flags. `--name=value` always carries a
 * value; `--name value` only for names listed in `valueFlags`. Short clusters
 * (`-la`) become one boolean flag per letter.
 */
export function parseArgs(
  tokens: readonly string[],
  valueFlags: readonly string[] = [],
): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] as string;

    if (token === '--') {
      positionals.push(...tokens.slice(index + 1));
      break;
    }

    if (token.startsWith('--') && token.length > 2) {
      const [name = '', ...rest] = token.slice(2).split('=');

      if (rest.length > 0) flags[name] = rest.join('=');
      else if (valueFlags.includes(name) && index + 1 < tokens.length) {
        flags[name] = tokens[(index += 1)] as string;
      } else flags[name] = true;
    } else if (/^-[a-z]+$/i.test(token)) {
      for (const letter of token.slice(1)) flags[letter] = true;
    } else positionals.push(token);
  }

  return { positionals, flags, raw: [...tokens] };
}

export function wantsHelp(args: ParsedArgs): boolean {
  return Boolean(args.flags['help'] || args.flags['h']);
}
