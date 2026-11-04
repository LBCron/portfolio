import type {
  ProjectKind,
  ProjectStatus,
  SvgData,
  TechCategory,
  TitleFont,
  linkKinds,
  linkPlacements,
} from './schema';

/**
 * What the repository returns: one locale, hidden items removed, icons
 * resolved, the phone number only when the owner enabled it.
 */

export interface ImageRef {
  url: string;
  width: number;
  height: number;
  lqip?: string;
  alt: string;
  focal?: { x: number; y: number };
}

export interface FileRef {
  url: string;
  size: number;
}

export interface Metric {
  value: string;
  label: string;
  countTo?: number;
  prefix?: string;
  suffix?: string;
}

export interface Profile {
  displayName: string;
  jobTitle: string;
  heroLead: string;
  titleFont?: TitleFont;
  photo?: ImageRef;
  /** Side-by-side hero art (lg+); falls back to `photo` when absent. */
  photoLg?: ImageRef;
  /** Markdown. */
  bio: string;
  location: string;
  spokenLanguages: string[];
  focus: string;
  metrics: Metric[];
  updatedAt: string;
}

export interface Contact {
  email: string;
  /** Present only when `showPhone` is enabled. */
  phone?: string;
  bookingUrl?: string;
  ctaHeading: string;
  ctaText: string;
}

export interface Resume {
  files: Partial<Record<'en' | 'pt', FileRef>>;
  updatedAt: string;
}

export type LinkKind = (typeof linkKinds)[number];
export type LinkPlacement = (typeof linkPlacements)[number];

export type LinkIcon =
  ({ type: 'svg' } & SvgData) | { type: 'lucide'; name: string };

export interface FeaturedLink {
  id: string;
  label: string;
  url: string;
  kind: LinkKind;
  icon: LinkIcon;
  placements: LinkPlacement[];
  isOwnProfile: boolean;
  order: number;
}

export interface RecommendedProfile {
  id: string;
  name: string;
  role: string;
  note: string;
  url: string;
  avatar?: ImageRef;
  order: number;
}

export type TechIcon = SvgData | { monogram: string };

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  icon: TechIcon;
  brandColor?: string;
  url?: string;
  priority: 1 | 2 | 3;
  order: number;
}

export interface Practice {
  id: string;
  label: string;
  order: number;
}

export interface GalleryImage extends ImageRef {
  caption?: string;
}

export interface Project {
  id: string;
  slug: string;
  previousSlugs: string[];
  featured: boolean;
  visible: true;
  order: number;
  year: number;
  kind: ProjectKind;
  status: ProjectStatus;
  /** Visible technologies only. */
  techIds: string[];
  cover?: ImageRef;
  gallery: GalleryImage[];
  links: { live?: string; repo?: string };
  title: string;
  tagline: string;
  summary: string;
  role: string;
  context: string;
  approach: string;
  highlights: string[];
  outcome?: string;
  /** Markdown (GFM). */
  body?: string;
  updatedAt: string;
}

/** Cards, lists and the terminal: everything except the long-form parts. */
export type ProjectSummary = Omit<Project, 'body' | 'gallery'>;

export type ProjectLookup =
  | { status: 'found'; project: Project }
  | { status: 'moved'; slug: string }
  | { status: 'missing' };

export interface ProjectRoute {
  slug: string;
  updatedAt: string;
}

export interface ExperienceRole {
  title: string;
  start: string;
  end?: string;
  summary: string;
  bullets: string[];
}

export interface Experience {
  id: string;
  /** Derived from `company`; unique across visible entries. */
  slug: string;
  company: string;
  companyUrl?: string;
  location: string;
  roles: ExperienceRole[];
  techIds: string[];
  collapsedByDefault: boolean;
  order: number;
}

export interface Education {
  id: string;
  kind: 'degree' | 'certification';
  title: string;
  institution: string;
  start?: string;
  end?: string;
  url?: string;
  order: number;
}
