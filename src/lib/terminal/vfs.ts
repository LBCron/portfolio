import { formatPartialDate } from '@/lib/format';

import type { ContentSnapshot } from './snapshot';

export type Translate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export const HOME = '~';

/** `~`, `~/x`, `/x` and relative paths resolve to a canonical `~/…` path. */
export function resolvePath(cwd: string, input: string): string {
  let base: string[];
  let rest = input;
  if (input === '~' || input.startsWith('~/')) {
    base = [];
    rest = input.slice(1);
  } else if (input.startsWith('/')) base = [];
  else base = cwd.split('/').slice(1);

  const segments = [...base];
  for (const part of rest.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') segments.pop();
    else segments.push(part);
  }
  return [HOME, ...segments].join('/');
}

interface DirNode {
  type: 'dir';
  children: string[];
}
interface FileNode {
  type: 'file';
  text: string;
  binary: boolean;
}

export interface VirtualFS {
  stat(path: string): 'dir' | 'file' | null;
  /** Directories first, then files; names only. */
  list(path: string): { name: string; type: 'dir' | 'file' }[];
  read(path: string): { text: string; binary: boolean } | null;
  tree(path: string): string[];
}

const CATEGORY_FILES = [
  'language',
  'frontend',
  'backend',
  'data',
  'cloud',
  'integration',
  'ai',
] as const;

export function buildVfs(snapshot: ContentSnapshot, t: Translate): VirtualFS {
  const nodes = new Map<string, DirNode | FileNode>();
  const locale = snapshot.locale;
  const date = (value: string) => formatPartialDate(locale, value);
  const period = (start?: string, end?: string) =>
    [start ? date(start) : '', end ? date(end) : t('resume.present')]
      .filter(Boolean)
      .join(' – ');

  function dir(path: string) {
    if (!nodes.has(path)) nodes.set(path, { type: 'dir', children: [] });
  }
  function file(path: string, lines: (string | undefined)[], binary = false) {
    const parent = path.slice(0, path.lastIndexOf('/'));
    dir(parent);
    (nodes.get(parent) as DirNode).children.push(path);
    nodes.set(path, {
      type: 'file',
      binary,
      text: lines.filter((line) => line !== undefined).join('\n'),
    });
  }

  dir(HOME);
  const { profile } = snapshot;
  if (profile) {
    file(`${HOME}/about.md`, [
      `# ${profile.displayName}`,
      profile.jobTitle,
      '',
      profile.bio,
    ]);
  }
  if (snapshot.contact) {
    const { user, domain, bookingUrl } = snapshot.contact;
    file(`${HOME}/contact.md`, [
      `${t('terminal.labels.email')}: ${user}@${domain}`,
      bookingUrl ? `${t('terminal.labels.booking')}: ${bookingUrl}` : undefined,
    ]);
  }
  file(
    `${HOME}/education.md`,
    snapshot.education.flatMap((item) => [
      `- ${item.title}`,
      `  ${item.institution}${item.start || item.end ? ` (${period(item.start, item.end)})` : ''}`,
    ]),
  );
  file(
    `${HOME}/links.md`,
    snapshot.links.map((link) => `- ${link.label}: ${link.url}`),
  );
  file(
    `${HOME}/recommended.md`,
    snapshot.recommended.flatMap((person) => [
      `- ${person.name}, ${person.role}`,
      `  ${person.note}`,
      `  ${person.url}`,
    ]),
  );
  file(`${HOME}/resume.pdf`, [], true);

  dir(`${HOME}/experience`);
  for (const entry of snapshot.experience) {
    file(`${HOME}/experience/${entry.slug}.md`, [
      `# ${entry.company}`,
      entry.location,
      ...entry.roles.flatMap((role) => [
        '',
        `## ${role.title} (${period(role.start, role.end)})`,
        role.summary,
        ...role.bullets.map((bullet) => `- ${bullet}`),
      ]),
      entry.technologies.length > 0 ? '' : undefined,
      entry.technologies.length > 0
        ? `${t('project.technologies')}: ${entry.technologies.join(', ')}`
        : undefined,
    ]);
  }

  dir(`${HOME}/projects`);
  for (const project of snapshot.projects) {
    file(`${HOME}/projects/${project.slug}.md`, [
      `# ${project.title}`,
      project.tagline,
      '',
      `${t('project.year')}: ${project.year}`,
      `${t('project.kind')}: ${t(`work.kinds.${project.kind}`)}`,
      `${t('project.status')}: ${t(`work.statuses.${project.status}`)}`,
      `${t('project.role')}: ${project.role}`,
      '',
      project.summary,
      '',
      `## ${t('project.context')}`,
      project.context,
      '',
      `## ${t('project.approach')}`,
      project.approach,
      '',
      `## ${t('project.highlights')}`,
      ...project.highlights.map((item) => `- ${item}`),
      project.outcome ? '' : undefined,
      project.outcome ? `## ${t('project.outcome')}` : undefined,
      project.outcome,
      '',
      project.technologies.length > 0
        ? `${t('project.technologies')}: ${project.technologies.join(', ')}`
        : undefined,
      project.links.live ? `URL: ${project.links.live}` : undefined,
      project.links.repo
        ? `${t('project.repository')}: ${project.links.repo}`
        : undefined,
    ]);
  }

  dir(`${HOME}/stack`);
  for (const category of CATEGORY_FILES) {
    const names = snapshot.technologies
      .filter((tech) => tech.category === category)
      .map((tech) => tech.name);
    if (names.length > 0) file(`${HOME}/stack/${category}.txt`, names);
  }
  if (snapshot.practices.length > 0) {
    file(`${HOME}/stack/practices.txt`, snapshot.practices);
  }

  const kindOf = (path: string) => nodes.get(path)?.type ?? null;

  function list(path: string) {
    const node = nodes.get(path);
    if (node?.type !== 'dir') return [];
    return node.children
      .map((child) => ({
        name: child.slice(child.lastIndexOf('/') + 1),
        type: kindOf(child) as 'dir' | 'file',
      }))
      .sort(
        (a, b) =>
          Number(b.type === 'dir') - Number(a.type === 'dir') ||
          a.name.localeCompare(b.name),
      );
  }

  function tree(path: string, prefix = ''): string[] {
    return list(path).flatMap((entry, index, all) => {
      const last = index === all.length - 1;
      const line = `${prefix}${last ? '└── ' : '├── '}${entry.name}${entry.type === 'dir' ? '/' : ''}`;
      return entry.type === 'dir'
        ? [
            line,
            ...tree(
              `${path}/${entry.name}`,
              `${prefix}${last ? '    ' : '│   '}`,
            ),
          ]
        : [line];
    });
  }

  // Directories sort after their parent was registered; link them in.
  for (const path of [...nodes.keys()]) {
    if (path === HOME) continue;
    const parent = path.slice(0, path.lastIndexOf('/'));
    const node = nodes.get(parent);
    if (node?.type === 'dir' && !node.children.includes(path)) {
      node.children.push(path);
    }
  }

  return {
    stat: kindOf,
    list,
    tree: (path) => [path === HOME ? HOME : path, ...tree(path)],
    read(path) {
      const node = nodes.get(path);
      return node?.type === 'file'
        ? { text: node.text, binary: node.binary }
        : null;
    },
  };
}
