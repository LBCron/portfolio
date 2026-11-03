import { describe, expect, it } from 'vitest';

import { createFixtureDataset } from '../fixtures/dataset';
import { findAttention } from './attention';
import type { AdminDoc } from './types';

const asDocs = <T>(list: T[]) => list as unknown as AdminDoc[];

describe('findAttention', () => {
  it('flags a missing translation, a missing alt text and SEO lengths', () => {
    const items = findAttention({
      practice: asDocs([
        { id: 'practice.1', label: { en: 'Testing', pt: ' ' } },
      ]),
      project: asDocs([
        {
          id: 'project.1',
          visible: true,
          title: { en: 'T'.repeat(70), pt: 'ok' },
          summary: { en: 'short', pt: 'short' },
          cover: {
            asset: { url: '/fixtures/images/a.webp' },
            alt: { en: 'x', pt: '' },
          },
        },
      ]),
    });
    const text = items.map((item) => item.issue).join('\n');
    expect(items.find((item) => item.id === 'practice.1')?.issue).toMatch(
      /missing in Portuguese/,
    );
    expect(text).toMatch(/Title \(en\) is 70/);
    expect(text).toMatch(/Summary \(en\) is 5/);
    expect(text).toMatch(/no alt text/);
  });

  it('flags a missing translation on array items that carry a _key', () => {
    const items = findAttention({
      practice: asDocs([
        { id: 'practice.1', label: { _key: 'k1', en: 'Testing', pt: '' } },
      ]),
    });
    expect(items[0]?.issue).toMatch(/missing in Portuguese/);
  });

  it('flags thin write-ups and stays quiet about long ones', () => {
    const long = Array.from({ length: 160 }, () => 'word').join(' ');
    const items = findAttention({
      project: asDocs([
        { id: 'project.thin', visible: true, body: { en: 'Too short.' } },
        { id: 'project.long', visible: true, body: { en: long, pt: long } },
        { id: 'project.hidden', visible: false },
      ]),
    });
    const thin = items.filter((item) => /thin page/.test(item.issue));
    expect(thin.map((item) => item.id)).toEqual(['project.thin']);
    expect(thin[0]?.issue).toBe(
      'Write-up has 2 words (en) and 0 (pt); under 150 reads as a thin page',
    );
  });

  it('warns when more than six projects are featured', () => {
    const many = Array.from({ length: 7 }, (_, index) => ({
      id: `project.${index}`,
      featured: true,
      visible: true,
    }));
    const items = findAttention({ project: asDocs(many) });
    expect(items.at(-1)?.issue).toBe('7 projects are featured; Home shows 6');
  });

  it('is quiet about complete, well-formed fixture content except what it really lacks', () => {
    const dataset = createFixtureDataset();
    const items = findAttention({
      profile: asDocs(dataset.profile),
      featuredLink: asDocs(dataset.featuredLink),
    });
    expect(items.filter((item) => /Portuguese/.test(item.issue))).toEqual([]);
  });
});
