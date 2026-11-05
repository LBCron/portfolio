import { renderToStaticMarkup } from 'react-dom/server';

import { Markdown, type MarkdownImage } from './markdown';

const gallery: MarkdownImage[] = [
  { url: '/fixtures/images/a.webp', width: 1600, height: 1000, alt: 'First' },
];

function render(markdown: string, images: MarkdownImage[] = []): string {
  return renderToStaticMarkup(
    <Markdown
      newTabLabel="(opens in a new tab)"
      scrollRegionLabel="Scrollable content"
      idPrefix="body"
      images={images}
    >
      {markdown}
    </Markdown>,
  );
}

describe('Markdown', () => {
  it('drops raw HTML and scripts', () => {
    const html = render(
      'Hi <script>alert(1)</script> <b onclick="x()">bold</b>\n\n<iframe src="https://evil.example"></iframe>',
    );

    expect(html).not.toMatch(/<script|<iframe|onclick|<b>/i);
    expect(html).toContain('Hi');
  });

  it('removes javascript:, data: and http: links', () => {
    const html = render('[a](javascript:alert(1)) [b](data:text/html,x) [c](http://example.com)');

    expect(html).not.toMatch(/javascript:|data:|http:/);
    expect(html).not.toContain('href=""');
  });

  it('opens external links in a new tab and keeps internal ones', () => {
    const html = render('[out](https://example.com) [in](/en/projects)');

    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">out<span class="sr-only"> (opens in a new tab)</span></a>',
    );
    expect(html).toContain('<a href="/en/projects">in</a>');
  });

  it('shifts headings below the page h1 with stable unique ids', () => {
    const html = render('# Top\n\n## Same\n\n## Same\n\n### Deep');

    expect(html).not.toContain('<h1');
    expect(html).toContain('<h2 id="body-top">Top</h2>');
    expect(html).toContain('<h3 id="body-same">Same</h3>');
    expect(html).toContain('<h3 id="body-same-2">Same</h3>');
    expect(html).toContain('<h4 id="body-deep">Deep</h4>');
  });

  it('keeps h2 as the top level when the document starts there', () => {
    expect(render('## Problem\n\n### Detail')).toContain('<h2 id="body-problem">');
  });

  it('renders only gallery images', () => {
    const html = render(
      '![one](gallery:1) ![two](https://cdn.example.com/x.png) ![miss](gallery:9)',
      gallery,
    );

    expect(html.match(/<img/g)).toHaveLength(1);
    expect(html).toContain('alt="one"');
    expect(html).not.toContain('cdn.example.com');
  });

  it('wraps tables in a focusable scroll region', () => {
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |');

    expect(html).toMatch(
      /<div role="region" aria-label="Scrollable content" tabindex="0" class="md-scroll"><table>/,
    );
  });
});
