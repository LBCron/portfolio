import { type Options as SanitizeSchema } from 'rehype-sanitize';

/**
 * Strict allowlist for Markdown output (§12.8). No raw HTML reaches this point
 * (`skipHtml`), but the schema still guards everything remark emits.
 */
export const markdownSchema: SanitizeSchema = {
  strip: ['script', 'style'],
  tagNames: [
    'p',
    'a',
    'strong',
    'em',
    'del',
    'code',
    'pre',
    'blockquote',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'br',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
  ],
  attributes: {
    a: ['href'],
    img: ['src', 'alt'],
    th: ['align'],
    td: ['align'],
    ol: ['start'],
    code: [['className', /^language-[a-z0-9-]+$/]],
  },
  protocols: {
    href: ['https', 'mailto'],
    src: ['https', 'gallery'],
  },
  clobber: [],
  required: {},
  allowComments: false,
  allowDoctypes: false,
};
