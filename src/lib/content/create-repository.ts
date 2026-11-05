import 'server-only';

import { resolveLinkIcon, resolveTechIcon } from './icons/resolve';
import { contentLogger, type ContentLogger } from './log';
import { createTechFilter, parseCollection, parseDocument } from './pipeline';
import { type ContentRepository } from './repository';
import {
  type ContentLocale,
  type ImageField,
  type LocalizedText,
  type ProjectDocument,
} from './schema';
import { uniqueSlugs } from './slugify';
import { type ImageRef, type Project, type ProjectLookup, type ProjectSummary } from './types';

/**
 * Raw reads an adapter provides. Shapes follow `schema.ts` field names; the
 * repository validates, filters, sorts and localizes them identically for every
 * adapter.
 */
export interface ContentSource {
  contact(): Promise<unknown>;
  education(): Promise<unknown[]>;
  experience(): Promise<{ entries: unknown[]; technologies: unknown[] }>;
  featuredLinks(): Promise<unknown[]>;
  readonly name: 'fixtures' | 'sanity';
  practices(): Promise<unknown[]>;
  profile(): Promise<unknown>;
  /**
   * Visible projects without `body` and `gallery`, plus technology refs.
   */
  projects(): Promise<ProjectsRead>;
  /**
   * Full projects whose current or previous slug equals `slug`.
   */
  projectsBySlug(slug: string): Promise<ProjectsRead>;
  recommendedProfiles(): Promise<unknown[]>;
  resume(): Promise<unknown>;
  technologies(): Promise<unknown[]>;
}

export interface ProjectsRead {
  projects: unknown[];
  /**
   * `{ id, visible }` for every technology.
   */
  technologies: unknown[];
}

function pick(field: LocalizedText, locale: ContentLocale): string;
function pick(field: LocalizedText | undefined, locale: ContentLocale): string | undefined;
function pick(field: LocalizedText | undefined, locale: ContentLocale): string | undefined {
  return field?.[locale];
}

function image(field: ImageField | undefined, locale: ContentLocale): ImageRef | undefined {
  if (!field) return undefined;

  return {
    ...field.asset,
    alt: field.alt[locale],
    ...(field.focal ? { focal: field.focal } : {}),
  };
}

function defined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

/**
 * Drops visible projects whose slug repeats an earlier one (by `order`), so
 * routes stay unambiguous.
 */
function uniqueBySlug(projects: ProjectDocument[], logger: ContentLogger): ProjectDocument[] {
  const seen = new Set<string>();

  return projects.filter((project) => {
    if (seen.has(project.slug)) {
      logger.warn('duplicate-slug', { id: project.id, slug: project.slug });

      return false;
    }

    seen.add(project.slug);

    return true;
  });
}

function toSummary(
  project: ProjectDocument,
  techIds: string[],
  locale: ContentLocale,
): ProjectSummary {
  return defined({
    id: project.id,
    slug: project.slug,
    previousSlugs: project.previousSlugs,
    featured: project.featured,
    visible: true as const,
    order: project.order,
    year: project.year,
    kind: project.kind,
    status: project.status,
    techIds,
    cover: image(project.cover, locale),
    links: defined({ ...project.links }),
    title: pick(project.title, locale),
    tagline: pick(project.tagline, locale),
    summary: pick(project.summary, locale),
    role: pick(project.role, locale),
    context: pick(project.context, locale),
    approach: pick(project.approach, locale),
    highlights: project.highlights.map((item) => pick(item, locale)),
    outcome: pick(project.outcome, locale),
    updatedAt: project.updatedAt,
  });
}

function toProject(project: ProjectDocument, techIds: string[], locale: ContentLocale): Project {
  return defined({
    ...toSummary(project, techIds, locale),
    gallery: project.gallery.map((item) =>
      defined({
        ...(image(item, locale) as ImageRef),
        caption: pick(item.caption, locale),
      }),
    ),
    body: pick(project.body, locale),
  });
}

export function createRepository(
  source: ContentSource,
  logger: ContentLogger = contentLogger,
): ContentRepository {
  async function readProjects() {
    const read = await source.projects();
    const filterTech = createTechFilter(read.technologies, logger);
    const projects = uniqueBySlug(parseCollection('project', read.projects, logger), logger);

    return { projects, filterTech };
  }

  return {
    source: source.name,

    async getProfile(locale) {
      const profile = parseDocument('profile', await source.profile(), logger);

      if (!profile) return null;

      return defined({
        displayName: profile.displayName,
        jobTitle: pick(profile.jobTitle, locale),
        heroLead: pick(profile.heroLead, locale),
        titleFont: profile.titleFont,
        photo: image(profile.photo, locale),
        photoLg: image(profile.photoLg, locale),
        bio: pick(profile.bio, locale),
        location: pick(profile.location, locale),
        spokenLanguages: profile.spokenLanguages.map((language) => pick(language, locale)),
        focus: pick(profile.focus, locale),
        metrics: profile.metrics.map((metric) =>
          defined({
            value: metric.value,
            label: pick(metric.label, locale),
            countTo: metric.countTo,
            prefix: metric.prefix,
            suffix: metric.suffix,
          }),
        ),
        updatedAt: profile.updatedAt,
      });
    },

    async getContact(locale) {
      const contact = parseDocument('contact', await source.contact(), logger);

      if (!contact) return null;

      return defined({
        email: contact.email,
        phone: contact.showPhone ? contact.phone : undefined,
        bookingUrl: contact.bookingUrl,
        ctaHeading: pick(contact.ctaHeading, locale),
        ctaText: pick(contact.ctaText, locale),
      });
    },

    async getResume() {
      const resume = parseDocument('resume', await source.resume(), logger);

      if (!resume) return null;

      const files: Awaited<ReturnType<ContentRepository['getResume']>> = {
        files: {},
        updatedAt: resume.updatedAt,
      };
      for (const locale of ['en', 'pt'] as const) {
        const file = resume.file[locale];

        if (file) files.files[locale] = { url: file.url, size: file.size };
      }

      return files;
    },

    async getFeaturedLinks(locale) {
      const links = parseCollection('featuredLink', await source.featuredLinks(), logger);

      return Promise.all(
        links.map(async (link) => ({
          id: link.id,
          label: pick(link.label, locale),
          url: link.url,
          kind: link.kind,
          icon: await resolveLinkIcon(link.icon),
          placements: link.placements,
          isOwnProfile: link.isOwnProfile,
          order: link.order,
        })),
      );
    },

    async getRecommendedProfiles(locale) {
      const profiles = parseCollection(
        'recommendedProfile',
        await source.recommendedProfiles(),
        logger,
      );

      return profiles.map((profile) =>
        defined({
          id: profile.id,
          name: profile.name,
          role: pick(profile.role, locale),
          note: pick(profile.note, locale),
          url: profile.url,
          avatar: profile.avatar
            ? defined({
                ...profile.avatar.asset,
                alt: profile.name,
                focal: profile.avatar.focal,
              })
            : undefined,
          order: profile.order,
        }),
      );
    },

    async getProjects(locale) {
      const { projects, filterTech } = await readProjects();

      return projects.map((project) =>
        toSummary(project, filterTech(project.id, project.techIds), locale),
      );
    },

    async getProject(locale, slug): Promise<ProjectLookup> {
      const read = await source.projectsBySlug(slug);
      const filterTech = createTechFilter(read.technologies, logger);
      const candidates = parseCollection('project', read.projects, logger);
      const current = candidates.find((project) => project.slug === slug);

      if (current) {
        return {
          status: 'found',
          project: toProject(current, filterTech(current.id, current.techIds), locale),
        };
      }

      const moved = candidates.find((project) => project.previousSlugs.includes(slug));

      return moved ? { status: 'moved', slug: moved.slug } : { status: 'missing' };
    },

    async getProjectRoutes() {
      const { projects } = await readProjects();

      return projects.map((project) => ({
        slug: project.slug,
        updatedAt: project.updatedAt,
      }));
    },

    async getExperience(locale) {
      const read = await source.experience();
      const filterTech = createTechFilter(read.technologies, logger);
      const entries = parseCollection('experience', read.entries, logger);
      const slugs = uniqueSlugs(entries.map((entry) => entry.company));

      return entries.map((entry, index) =>
        defined({
          id: entry.id,
          slug: slugs[index] ?? entry.id,
          company: entry.company,
          companyUrl: entry.companyUrl,
          location: pick(entry.location, locale),
          roles: entry.roles.map((role) =>
            defined({
              title: pick(role.title, locale),
              start: role.start,
              end: role.end,
              summary: pick(role.summary, locale),
              bullets: role.bullets.map((bullet) => pick(bullet, locale)),
            }),
          ),
          techIds: filterTech(entry.id, entry.techIds),
          collapsedByDefault: entry.collapsedByDefault,
          order: entry.order,
        }),
      );
    },

    async getEducation(locale) {
      const entries = parseCollection('education', await source.education(), logger);

      return entries.map((entry) =>
        defined({
          id: entry.id,
          kind: entry.kind,
          title: pick(entry.title, locale),
          institution: entry.institution,
          start: entry.start,
          end: entry.end,
          url: entry.url,
          order: entry.order,
        }),
      );
    },

    async getTechnologies() {
      const technologies = parseCollection('technology', await source.technologies(), logger);

      return Promise.all(
        technologies.map(async (tech) => {
          const resolved = await resolveTechIcon(tech);

          return defined({
            id: tech.id,
            name: tech.name,
            category: tech.category,
            icon: resolved.icon,
            brandColor: tech.brandColor ?? resolved.defaultBrandColor,
            url: tech.url,
            priority: tech.priority,
            order: tech.order,
          });
        }),
      );
    },

    async getPractices(locale) {
      const practices = parseCollection('practice', await source.practices(), logger);

      return practices.map((practice) => ({
        id: practice.id,
        label: pick(practice.label, locale),
        order: practice.order,
      }));
    },
  };
}
