import { type ContentSource } from '../create-repository';
import { type DocumentInput } from '../schema';
import { createFixtureDataset, type FixtureDataset } from './dataset';

interface Visible {
  visible?: boolean;
}

const isVisible = (document: Visible) => document.visible !== false;

function technologyRefs(dataset: FixtureDataset) {
  return dataset.technology.map((tech) => ({
    id: tech.id,
    visible: tech.visible ?? true,
  }));
}

function withoutLongForm(project: DocumentInput<'project'>) {
  const { body, gallery, ...summary } = project;

  return summary;
}

/**
 * In-memory source for the fictional dataset. Reads return copies so callers
 * can never mutate the store.
 */
export function createFixtureSource(
  dataset: FixtureDataset = createFixtureDataset(),
): ContentSource {
  const read = <T>(value: T): Promise<T> => Promise.resolve(structuredClone(value));

  return {
    name: 'fixtures',
    profile: () => read(dataset.profile[0] ?? null),
    contact: () => read(dataset.contact[0] ?? null),
    resume: () => read(dataset.resume[0] ?? null),
    featuredLinks: () => read(dataset.featuredLink.filter(isVisible)),
    recommendedProfiles: () => read(dataset.recommendedProfile.filter(isVisible)),
    projects: () =>
      read({
        projects: dataset.project.filter(isVisible).map(withoutLongForm),
        technologies: technologyRefs(dataset),
      }),
    projectsBySlug: (slug) =>
      read({
        projects: dataset.project.filter(
          (project) =>
            isVisible(project)
            && (project.slug === slug || (project.previousSlugs ?? []).includes(slug)),
        ),
        technologies: technologyRefs(dataset),
      }),
    experience: () =>
      read({
        entries: dataset.experience.filter(isVisible),
        technologies: technologyRefs(dataset),
      }),
    education: () => read(dataset.education.filter(isVisible)),
    technologies: () => read(dataset.technology.filter(isVisible)),
    practices: () => read(dataset.practice.filter(isVisible)),
  };
}
