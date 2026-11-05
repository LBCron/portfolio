'use client';

import { ArrowUpRight, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { type Block, type OutputNode, type Span, type Tone } from '@/lib/terminal/output';
import { type Translate } from '@/lib/terminal/vfs';

export const TONE_CLASS: Record<Tone, string> = {
  default: 'text-text-1',
  dim: 'text-text-3',
  bold: 'font-semibold text-text-1',
  accent: 'text-accent-2',
  success: 'text-term-green',
  warn: 'text-warn',
  error: 'text-danger',
  link: 'text-accent-1 underline underline-offset-2',
};

const CHIP_CLASS =
  'inline-flex min-h-6 items-center rounded-full border border-line-strong px-2.5 font-mono text-accent-2 hover-fine:bg-surface-2 pointer-coarse:min-h-9';

function Spans({ spans }: { spans: Span[] }) {
  return spans.map((span, index) => (
    <span key={index} className={TONE_CLASS[span.tone ?? 'default']}>
      {span.text}
    </span>
  ));
}

/**
 * Reveals text over ~450ms; the full text is always there for screen readers.
 */
function TypedText({ spans, immediate }: { immediate: boolean; spans: Span[] }) {
  const total = spans.reduce((sum, span) => sum + span.text.length, 0);
  const [count, setCount] = useState(immediate ? total : 0);

  useEffect(() => {
    if (immediate) return;

    const step = Math.max(1, Math.ceil(total / 28));
    const timer = window.setInterval(() => {
      setCount((current) => {
        if (current + step >= total) window.clearInterval(timer);

        return Math.min(total, current + step);
      });
    }, 16);

    return () => window.clearInterval(timer);
  }, [immediate, total]);

  if (immediate || count >= total) return <Spans spans={spans} />;

  const visible = spans.map((span, index) => {
    const before = spans.slice(0, index).reduce((sum, previous) => sum + previous.text.length, 0);

    return { ...span, text: span.text.slice(0, Math.max(0, count - before)) };
  });

  return (
    <>
      <span className="sr-only">{spans.map((span) => span.text).join('')}</span>
      <span aria-hidden="true">
        <Spans spans={visible} />
      </span>
    </>
  );
}

export function OutputRenderer({
  block,
  t,
  skipTyping,
  onRun,
}: {
  block: Block;
  onRun: (command: string) => void;
  skipTyping: boolean;
  t: Translate;
}) {
  return (
    <div className="mb-1" data-block={block.node.type}>
      <Node node={block.node} t={t} skipTyping={skipTyping} onRun={onRun} />
    </div>
  );
}

function Node({
  node,
  t,
  skipTyping,
  onRun,
}: {
  node: OutputNode;
  onRun: (command: string) => void;
  skipTyping: boolean;
  t: Translate;
}) {
  switch (node.type) {
    case 'ascii':
      if (node.label) {
        // Meaningful art (cowsay): one image with a name; plain text when narrow.
        return (
          <div className="@container">
            <pre
              role="img"
              aria-label={node.label}
              className="leading-tight text-text-1 @max-[20rem]:hidden"
            >
              {node.lines.join('\n')}
            </pre>
            <p className="hidden text-text-1 @max-[20rem]:block">{node.label}</p>
          </div>
        );
      }

      return (
        <div className="@container">
          <pre
            aria-hidden="true"
            className="decorative leading-tight text-accent-1 @max-[14rem]:hidden"
          >
            {node.lines.join('\n')}
          </pre>
          <p aria-hidden="true" className="decorative hidden text-accent-1 @max-[14rem]:block">
            {node.fallback ?? ''}
          </p>
        </div>
      );

    case 'blank':
      return <div aria-hidden="true" className={cn('h-2')} />;

    case 'command':
      return (
        <ul className="flex flex-wrap gap-2">
          {node.items.map((item) => (
            <li key={item.command}>
              <button type="button" onClick={() => onRun(item.command)} className={CHIP_CLASS}>
                {item.label ?? item.command}
              </button>
            </li>
          ))}
        </ul>
      );

    case 'kv':
      return (
        <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-4 gap-y-1">
          {node.items.map((item) => (
            <div key={item.key} className="contents">
              <dt className="text-text-3">
                {item.command ? (
                  <button
                    type="button"
                    onClick={() => onRun(item.command as string)}
                    className={CHIP_CLASS}
                  >
                    {item.key}
                  </button>
                ) : (
                  item.key
                )}
              </dt>
              <dd className="m-0 break-words text-text-1">{item.value}</dd>
            </div>
          ))}
        </dl>
      );

    case 'link':
      return (
        <ul className="flex flex-col gap-1">
          {node.items.map((item) => {
            const external = item.external === true;
            const plain = item.href.startsWith('mailto:');

            return (
              <li key={`${item.href}-${item.label}`}>
                {external || plain ? (
                  <a
                    href={item.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={TONE_CLASS.link}
                  >
                    {item.label}
                    {external ? (
                      <>
                        <ArrowUpRight aria-hidden="true" className="ml-0.5 inline size-3" />
                        <span className="sr-only"> {t('a11y.opensInNewTab')}</span>
                      </>
                    ) : null}
                  </a>
                ) : (
                  <Link href={item.href} className={TONE_CLASS.link}>
                    {item.label}
                  </Link>
                )}
                {item.note ? <span className="text-text-3"> {item.note}</span> : null}
              </li>
            );
          })}
        </ul>
      );

    case 'spinner':
      return (
        <p role="status" className="flex items-center gap-2 text-text-3">
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          {node.label}
        </p>
      );

    case 'table':
      return (
        <div
          role="region"
          aria-label={t('a11y.scrollRegion')}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard reachable
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-max border-separate border-spacing-x-4 border-spacing-y-0.5 text-left">
            {node.head ? (
              <thead>
                <tr>
                  {node.head.map((cell) => (
                    <th key={cell} scope="col" className="font-semibold text-text-3">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {node.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={cellIndex === 0 ? 'text-accent-2' : ''}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'text':
      return (
        <p className="break-words whitespace-pre-wrap">
          {node.typed ? (
            <TypedText spans={node.spans} immediate={skipTyping} />
          ) : (
            <Spans spans={node.spans} />
          )}
        </p>
      );

    case 'tree':
      return <pre className="overflow-x-auto font-mono text-text-1">{node.lines.join('\n')}</pre>;
  }
}
