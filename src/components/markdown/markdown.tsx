import Image from 'next/image';
import { type ComponentProps, type ReactNode } from 'react';
import ReactMarkdown, { type Components, defaultUrlTransform } from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/cn';
import { slugify } from '@/lib/content/slugify';

import { markdownSchema } from './schema';

export interface MarkdownImage {
  alt: string;
  height: number;
  lqip?: string;
  url: string;
  width: number;
}

interface MarkdownProps {
  children: string;
  className?: string;
  /**
   * Prefix for heading ids, unique per page.
   */
  idPrefix?: string;
  /**
   * Allowed images: `![alt](gallery:1)` or the exact asset URL.
   */
  images?: readonly MarkdownImage[];
  /**
   * Appended to external links for screen readers.
   */
  newTabLabel: string;
  /**
   * Accessible name for scrollable tables and code blocks.
   */
  scrollRegionLabel: string;
  /**
   * Level the document's top heading maps to (the page keeps one `h1`).
   */
  topHeadingLevel?: 2 | 3 | 4;
}

type Level = 1 | 2 | 3 | 4 | 5 | 6;

function topLevel(markdown: string): Level {
  const withoutCode = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
  let min = 6;
  for (const match of withoutCode.matchAll(/^(#{1,6})[ \t]/gm)) {
    min = Math.min(min, match[1]?.length ?? 6);
  }

  return min as Level;
}

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return `${node}`;

  if (Array.isArray(node)) return node.map(textOf).join('');

  if (node && typeof node === 'object' && 'props' in node) {
    const props = node.props as { children?: ReactNode };

    return textOf(props.children);
  }

  return '';
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/**
 * Markdown (GFM) rendered on the server through a strict sanitize schema. Raw
 * HTML is dropped, links are allowlisted (https, mailto, relative) and images
 * resolve only to the project's own gallery.
 */
export function Markdown({
  children,
  topHeadingLevel = 2,
  idPrefix = 'md',
  images = [],
  newTabLabel,
  scrollRegionLabel,
  className,
}: MarkdownProps): React.JSX.Element {
  const shift = topHeadingLevel - topLevel(children);
  const usedIds = new Map<string, number>();

  const heading = (level: Level) =>
    function Heading({ children: content }: { children?: ReactNode }): React.JSX.Element {
      const target = Math.min(Math.max(level + shift, topHeadingLevel), 6);
      const Tag = `h${target}` as 'h2';
      const base = `${idPrefix}-${slugify(textOf(content)) || 'section'}`;
      const count = usedIds.get(base) ?? 0;

      usedIds.set(base, count + 1);

      const id = count === 0 ? base : `${base}-${count + 1}`;

      return <Tag id={id}>{content}</Tag>;
    };

  const resolveImage = (src: string): MarkdownImage | undefined => {
    const galleryIndex = /^gallery:(\d+)$/.exec(src)?.[1];

    if (galleryIndex) return images[Number(galleryIndex) - 1];

    return images.find((image) => image.url === src);
  };

  const components: Components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    h5: heading(5),
    h6: heading(6),
    a: ({ href = '', children: content }) =>
      !href ? (
        <span>{content}</span>
      ) : isExternal(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
          <span className="sr-only"> {newTabLabel}</span>
        </a>
      ) : (
        <a href={href}>{content}</a>
      ),
    img: ({ src, alt }) => {
      const image = typeof src === 'string' ? resolveImage(src) : undefined;

      if (!image) return null;

      return (
        <Image
          src={image.url}
          width={image.width}
          height={image.height}
          alt={alt?.trim() || image.alt}
          sizes="(min-width: 1024px) 720px, 100vw"
          placeholder={image.lqip ? 'blur' : 'empty'}
          blurDataURL={image.lqip}
          className="h-auto w-full rounded-md border border-line"
        />
      );
    },
    table: ({ children: content }: ComponentProps<'table'>) => (
      <div
        role="region"
        aria-label={scrollRegionLabel}
        // Keyboard access for overflow (axe scrollable-region-focusable).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className="md-scroll"
      >
        <table>{content}</table>
      </div>
    ),
    pre: ({ children: content }: ComponentProps<'pre'>) => (
      // Same as tables: long lines scroll inside the block.
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      <pre tabIndex={0} aria-label={scrollRegionLabel}>
        {content}
      </pre>
    ),
  };

  return (
    <div className={cn('prose-site', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, markdownSchema]]}
        skipHtml
        urlTransform={(url) => (/^gallery:\d+$/.test(url) ? url : defaultUrlTransform(url))}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
