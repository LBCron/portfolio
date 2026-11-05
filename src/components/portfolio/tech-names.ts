import { type Technology } from '@/lib/content';

/**
 * Resolves technology ids to names, skipping unknown ones.
 */
export function techNameLookup(technologies: readonly Technology[]) {
  const names = new Map(technologies.map((tech) => [tech.id, tech.name]));

  return (ids: readonly string[]): string[] =>
    ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name));
}
