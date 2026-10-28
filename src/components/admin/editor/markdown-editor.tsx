'use client';

import { useRef, useState } from 'react';

import { Markdown } from '@/components/markdown/markdown';
import { cn } from '@/lib/cn';

import { inputClass, smallButton } from './styles';

interface MarkdownEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string | undefined;
  gallery: {
    url: string;
    width: number;
    height: number;
    alt: string;
    lqip?: string;
  }[];
}

interface Tool {
  label: string;
  glyph: string;
  before: string;
  after: string;
  placeholder: string;
  /** Line-based tools (lists, headings) set this instead. */
  prefix?: string;
}

const tools: Tool[] = [
  {
    label: 'Bold',
    glyph: 'B',
    before: '**',
    after: '**',
    placeholder: 'bold text',
  },
  {
    label: 'Italic',
    glyph: 'I',
    before: '_',
    after: '_',
    placeholder: 'italic text',
  },
  {
    label: 'Link',
    glyph: '🔗',
    before: '[',
    after: '](https://)',
    placeholder: 'link text',
  },
  {
    label: 'Bulleted list',
    glyph: '•',
    before: '',
    after: '',
    placeholder: '',
    prefix: '- ',
  },
  {
    label: 'Heading',
    glyph: 'H',
    before: '',
    after: '',
    placeholder: '',
    prefix: '## ',
  },
];

/** A textarea with a keyboard-reachable toolbar and a safe live preview. */
export function MarkdownEditor({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  gallery,
}: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  function edit(
    change: (selected: string) => { text: string; select: [number, number] },
  ) {
    const area = ref.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end } = area;
    const { text, select } = change(value.slice(start, end));
    onChange(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + select[0], start + select[1]);
    });
  }

  function apply(tool: Tool) {
    edit((selected) => {
      if (tool.prefix) {
        const text = (selected || 'Text')
          .split('\n')
          .map((line) => `${tool.prefix}${line}`)
          .join('\n');
        return { text, select: [tool.prefix.length, text.length] };
      }
      const inner = selected || tool.placeholder;
      return {
        text: `${tool.before}${inner}${tool.after}`,
        select: [tool.before.length, tool.before.length + inner.length],
      };
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="toolbar"
          aria-label="Formatting"
          className="flex flex-wrap gap-1"
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              aria-label={tool.label}
              disabled={disabled || preview}
              onClick={() => apply(tool)}
              className={cn(smallButton, 'px-2')}
            >
              <span aria-hidden="true">{tool.glyph}</span>
            </button>
          ))}
        </div>
        {gallery.length > 0 ? (
          <select
            aria-label="Insert gallery image"
            disabled={disabled || preview}
            value=""
            onChange={(event) => {
              const index = Number(event.target.value);
              if (index) {
                edit(() => {
                  const alt = gallery[index - 1]?.alt ?? '';
                  const text = `![${alt}](gallery:${index})`;
                  return { text, select: [text.length, text.length] };
                });
              }
            }}
            className={cn(inputClass, 'w-auto')}
          >
            <option value="">Insert image…</option>
            {gallery.map((image, index) => (
              <option key={image.url} value={index + 1}>
                Gallery {index + 1}
                {image.alt ? `: ${image.alt.slice(0, 30)}` : ''}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          aria-pressed={preview}
          onClick={() => setPreview((current) => !current)}
          className={cn(smallButton, 'ml-auto')}
        >
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="min-h-40 rounded-md border border-line bg-surface-1 p-4">
          {value.trim() ? (
            <Markdown
              topHeadingLevel={3}
              idPrefix="preview"
              images={gallery}
              newTabLabel="(opens in a new tab)"
              scrollRegionLabel="Scrollable content"
            >
              {value}
            </Markdown>
          ) : (
            <p className="text-text-3">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={ref}
          id={id}
          rows={12}
          value={value}
          disabled={disabled}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          spellCheck
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, 'font-mono text-small')}
        />
      )}
    </div>
  );
}
