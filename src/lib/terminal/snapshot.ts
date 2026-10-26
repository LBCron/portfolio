import type { AppLocale } from '@/i18n/routing';
import type {
  Contact,
  Education,
  Experience,
  FeaturedLink,
  Practice,
  Profile,
  ProjectSummary,
  RecommendedProfile,
  Resume,
  Technology,
} from '@/lib/content';

/**
 * Public, localized, JSON-safe content for the terminal. Hidden items never
 * reach it (the repository already filters them) and there is no phone
 * number, icon data or file URL.
 */
export interface ContentSnapshot {
  locale: AppLocale;
  profile: {
    displayName: string;
    jobTitle: string;
    bio: string;
    location: string;
    spokenLanguages: string[];
    focus: string;
    metrics: { value: string; label: string }[];
  } | null;
  /** Address parts, joined only in the browser (same idea as the site). */
  contact: { user: string; domain: string; bookingUrl?: string } | null;
  resume: Record<AppLocale, boolean>;
  links: {
    label: string;
    url: string;
    kind: string;
    isOwnProfile: boolean;
  }[];
  recommended: { name: string; role: string; note: string; url: string }[];
  projects: {
    slug: string;
    title: string;
    tagline: string;
    summary: string;
    kind: string;
    status: string;
    year: number;
    featured: boolean;
    role: string;
    context: string;
    approach: string;
    highlights: string[];
    outcome?: string;
    links: { live?: string; repo?: string };
    technologies: string[];
  }[];
  experience: {
    slug: string;
    company: string;
    location: string;
    roles: {
      title: string;
      start: string;
      end?: string;
      summary: string;
      bullets: string[];
    }[];
    technologies: string[];
  }[];
  education: {
    kind: 'degree' | 'certification';
    title: string;
    institution: string;
    start?: string;
    end?: string;
  }[];
  technologies: { name: string; category: string }[];
  practices: string[];
}

export interface SnapshotSource {
  locale: AppLocale;
  profile: Profile | null;
  contact: Contact | null;
  resume: Resume | null;
  links: FeaturedLink[];
  recommended: RecommendedProfile[];
  projects: ProjectSummary[];
  experience: Experience[];
  education: Education[];
  technologies: Technology[];
  practices: Practice[];
}

export function buildSnapshot(source: SnapshotSource): ContentSnapshot {
  const techNames = new Map(source.technologies.map((t) => [t.id, t.name]));
  const namesOf = (ids: string[]) =>
    ids.flatMap((id) => techNames.get(id) ?? []);
  const [user = '', domain = ''] = source.contact?.email.split('@') ?? [];

  return {
    locale: source.locale,
    profile: source.profile && {
      displayName: source.profile.displayName,
      jobTitle: source.profile.jobTitle,
      bio: source.profile.bio,
      location: source.profile.location,
      spokenLanguages: source.profile.spokenLanguages,
      focus: source.profile.focus,
      metrics: source.profile.metrics.map(({ value, label }) => ({
        value,
        label,
      })),
    },
    contact: source.contact && {
      user,
      domain,
      ...(source.contact.bookingUrl
        ? { bookingUrl: source.contact.bookingUrl }
        : {}),
    },
    resume: {
      en: Boolean(source.resume?.files.en),
      pt: Boolean(source.resume?.files.pt),
    },
    links: source.links.map(({ label, url, kind, isOwnProfile }) => ({
      label,
      url,
      kind,
      isOwnProfile,
    })),
    recommended: source.recommended.map(({ name, role, note, url }) => ({
      name,
      role,
      note,
      url,
    })),
    projects: source.projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      tagline: project.tagline,
      summary: project.summary,
      kind: project.kind,
      status: project.status,
      year: project.year,
      featured: project.featured,
      role: project.role,
      context: project.context,
      approach: project.approach,
      highlights: project.highlights,
      ...(project.outcome ? { outcome: project.outcome } : {}),
      links: project.links,
      technologies: namesOf(project.techIds),
    })),
    experience: source.experience.map((entry) => ({
      slug: entry.slug,
      company: entry.company,
      location: entry.location,
      roles: entry.roles,
      technologies: namesOf(entry.techIds),
    })),
    education: source.education.map(
      ({ kind, title, institution, start, end }) => ({
        kind,
        title,
        institution,
        ...(start ? { start } : {}),
        ...(end ? { end } : {}),
      }),
    ),
    technologies: source.technologies.map(({ name, category }) => ({
      name,
      category,
    })),
    practices: source.practices.map((practice) => practice.label),
  };
}

export function emptySnapshot(locale: AppLocale): ContentSnapshot {
  return {
    locale,
    profile: null,
    contact: null,
    resume: { en: false, pt: false },
    links: [],
    recommended: [],
    projects: [],
    experience: [],
    education: [],
    technologies: [],
    practices: [],
  };
}
