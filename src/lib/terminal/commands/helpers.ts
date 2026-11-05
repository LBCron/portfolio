import { type OutputNode, type Span, text } from '../output';
import { type Command, type CommandContext } from './types';

export const SECTIONS = ['about', 'experience', 'stack', 'work', 'recommended', 'contact'] as const;

/**
 * One text node from several lines, each with its own tone.
 */
export function lines(...items: Span[]): OutputNode {
  return {
    type: 'text',
    spans: items.map((item, index) => ({
      ...item,
      text: index < items.length - 1 ? `${item.text}\n` : item.text,
    })),
  };
}

export function usageOf(ctx: CommandContext, command: Command): OutputNode[] {
  return [
    text(ctx.t(command.summaryKey)),
    text(ctx.t('terminal.usage', { usage: ctx.t(command.usageKey) }), 'accent'),
  ];
}

export function errorText(message: string): OutputNode {
  return text(message, 'error');
}

/**
 * `2023-03` start/end pair, "present" when the end is missing.
 */
export function periodLabel(
  ctx: CommandContext,
  format: (value: string) => string,
  start?: string,
  end?: string,
) {
  return [start ? format(start) : '', end ? format(end) : ctx.t('resume.present')]
    .filter(Boolean)
    .join(' – ');
}
