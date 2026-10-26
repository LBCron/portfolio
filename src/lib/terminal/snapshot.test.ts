import { describe, expect, it } from 'vitest';

import { createRepository } from '@/lib/content/create-repository';
import { createFixtureSource } from '@/lib/content/fixtures/source';

import { buildSnapshot } from './snapshot';
import { fixtureSnapshot } from './test-utils';

describe.each(['en', 'pt'] as const)('snapshot (%s)', (locale) => {
  it('contains only public, visible, localized content', async () => {
    const snapshot = await fixtureSnapshot(locale);
    expect(snapshot.locale).toBe(locale);
    const slugs = snapshot.projects.map((project) => project.slug);
    expect(slugs).toContain('orbit-dashboard');
    expect(slugs).not.toContain('scratch-pad');
    expect(snapshot.recommended.map((p) => p.name)).not.toContain('Sofia Demo');
    expect(snapshot.contact).toEqual({
      user: 'hello',
      domain: 'example.com',
      bookingUrl: 'https://example.com/book',
    });
    expect(snapshot.resume).toEqual({ en: true, pt: true });
  });

  it('carries no phone numbers, icons or file URLs', async () => {
    const repository = createRepository(createFixtureSource(), {
      warn: () => {},
    });
    const contact = await repository.getContact(locale);
    const snapshot = buildSnapshot({
      ...(await Promise.all([
        repository.getProfile(locale),
        repository.getResume(),
        repository.getFeaturedLinks(locale),
        repository.getRecommendedProfiles(locale),
        repository.getProjects(locale),
        repository.getExperience(locale),
        repository.getEducation(locale),
        repository.getTechnologies(locale),
        repository.getPractices(locale),
      ]).then(
        ([
          profile,
          resume,
          links,
          recommended,
          projects,
          experience,
          education,
          technologies,
          practices,
        ]) => ({
          profile,
          resume,
          links,
          recommended,
          projects,
          experience,
          education,
          technologies,
          practices,
        }),
      )),
      locale,
      contact: contact && { ...contact, phone: '+55 41 99999-0000' },
    });
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('99999');
    expect(json).not.toContain('phone');
    expect(json).not.toContain('/fixtures/');
    expect(json).not.toContain('viewBox');
  });
});
